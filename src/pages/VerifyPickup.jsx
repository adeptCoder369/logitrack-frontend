import { useState, useEffect } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { pickupApi, purchaseOrdersApi, depotInventoryApi, getFileUrl, transportersApi, companiesApi } from "../lib/api";
import { MultiPhotoUpload } from "../components/shared/FileUpload";
import { usePermissions } from "../lib/permissions";
import { toast } from "sonner";
import { Calendar, Upload, Eye, Cross, FileX } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { VerifyPickupOrdersDataTable } from "@/components/verifyPickup/DataTable";
import { FilterPanel } from "@/components/verifyPickup/FilterPanel";

export default function VerifyPickup() {
  const { hasPermission, hasActionPermission } = usePermissions();
  const canView = hasPermission("Verify Pickup");
  const canVerify = hasActionPermission('verify_pickup');
  const [statusFilter, setStatusFilter] = useState("loaded");
  const [transporterFilter, setTransporterFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [editingTransporter, setEditingTransporter] = useState({});
  const [editingCompany, setEditingCompany] = useState({});

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [weights, setWeights] = useState({});
  const [files, setFiles] = useState({});

  const [inputErrors, setInputErrors] = useState({});

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState({});
  const [depotInventory, setDepotInventory] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [companies, setCompanies] = useState([]);

  const fetchData = async () => {
    try {
      const [
        res,
        poRes,
        depotInventoryRes,
        transporterRes,
        companiesRes
      ] = await Promise.all([
        pickupApi.getAll({ start_date: startDate, end_date: endDate }),
        purchaseOrdersApi.getAll(),
        depotInventoryApi.getAll(),
        transportersApi.getAll(),
        companiesApi.getAll()
      ]);

      setPurchaseOrders(poRes.data || []);
      setDepotInventory(depotInventoryRes.data || []);
      setTransporters(transporterRes.data || []);
      setCompanies(companiesRes.data || []);
      setData(res.data || []);
    } catch {
      toast.error("Failed to load pickups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  // 🚫 Prevent future date and invalid range
  const handleStartDateChange = (val) => {
    const today = new Date().toISOString().split("T")[0];
    if (val > today) {
      toast.error("Future date not allowed");
      return;
    }
    if (endDate && val > endDate) {
      toast.error("Start date cannot be after end date");
      return;
    }
    setStartDate(val);
  };

  const handleEndDateChange = (val) => {
    const today = new Date().toISOString().split("T")[0];
    if (val > today) {
      toast.error("Future date not allowed");
      return;
    }
    if (startDate && val < startDate) {
      toast.error("End date cannot be before start date");
      return;
    }
    setEndDate(val);
  };

  // ✅ Verify
  const getAvailableInventory = (depotId, productId) => {
    const inventory = depotInventory.find(
      (item) => item.depot_id === depotId && item.product_id === productId
    );
    return Number(inventory?.available_quantity || 0);
  };

  const handleVerify = async (row) => {
    if (!canVerify) {
      return toast.error('You do not have permission to verify pickups');
    }
    const weight = weights[row.id];
    const poId = selectedPO[row.id];
    const po = purchaseOrders.find(p => String(p.id) === String(poId));

    if (!poId) {
      return toast.error("Purchase Order required");
    }

    if (!weight) {
      return toast.error("Enter weight");
    }

    const w = Number(weight);
    const available = getAvailableInventory(po?.depot_id, po?.product_id);
    if (w > available) {
      return toast.error(
        `Stock insufficient! Weight (${w} MT) exceeds depot available quantity (${available.toFixed(2)} MT). Add inventory to proceed.`
      );
    }

    const slips = files[row.id] || [];

    try {
      await pickupApi.verify(row.id, {
        weight_mt: parseFloat(weight),
        weight_slips: (files[row.id] || []).map(p => p.file_id),

        purchase_order_id: po.id,
        purchase_order_no: po.po_number,
        purchase_order_company_name: po.to_company_name,

        product_id: po.product_id,
        product_name: po.product_name,

        depot_id: po.depot_id,
        depot_name: po.depot_name
      });

      toast.success("Verified successfully");
      fetchData();
    } catch {
      toast.error("Verification failed");
    }
  };

  const uniqueTransporters = [
    ...new Set(
      data
        .map(d => d.transporter_name)
        .filter(Boolean)
    )
  ];

  const uniqueCompanies = [
    ...new Set(
      data
        .map(d =>
          d.purchase_order_company_name ||
          d.company_name ||
          purchaseOrders.find(
            p => String(p.id) === String(d.purchase_order_id)
          )?.to_company_name
        )
        .filter(Boolean)
    )
  ];

  // 📋 Table columns
  const columns = [
    {
      key: "truck_number",
      label: "Truck",
      render: (v) => <span className="mono font-medium">{v}</span>
    },
    {
      key: "date",
      label: "Date",
      render: (v) => v
        ? new Date(v).toLocaleDateString("en-GB")
        : "-"
    },
    {
      key: "transporter_name",
      label: "Transporter",
      render: (v, row) => {

        if (row.status !== "loaded") {
          return v || "-";
        }

        return (
          <div className="flex gap-2 items-center min-w-[280px]">

            {/* TRANSPORTER DROPDOWN */}
            <Select
              value={
                editingTransporter[row.id] ??
                row.transporter_name ??
                ""
              }
              onValueChange={(v) =>
                setEditingTransporter({
                  ...editingTransporter,
                  [row.id]: v
                })
              }
            >

              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select Transporter" />
              </SelectTrigger>

              <SelectContent>

                {transporters.map((t) => (

                  <SelectItem
                    key={t.id}
                    value={t.name}
                  >
                    {t.name}
                  </SelectItem>

                ))}

              </SelectContent>

            </Select>

            {/* SAVE */}
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                if (!canVerify) {
                  return toast.error('You do not have permission to update transporter');
                }
                try {

                  const transporter =
                    transporters.find(
                      t =>
                        t.name === (
                          editingTransporter[row.id] ||
                          row.transporter_name
                        )
                    );

                  await pickupApi.updateTransporter(
                    row.id,
                    {
                      transporter_name:
                        transporter?.name ||
                        editingTransporter[row.id] ||
                        row.transporter_name,

                      transporter_id:
                        transporter?.id ||
                        row.transporter_id
                    }
                  );

                  toast.success(
                    "Transporter updated"
                  );

                  fetchData();

                } catch (err) {

                  toast.error(
                    err?.response?.data?.detail ||
                    "Failed to update transporter"
                  );
                }
              }}
            >
              Save
            </Button>

          </div>
        );
      }
    },
    {
      key: "company_name",
      label: "Company",
      render: (v, row) => {

        if (row.status !== "loaded") {
          return v || "-";
        }

        return (
          <div className="flex gap-2 items-center min-w-[280px]">

            {/* COMPANY DROPDOWN */}
            <Select
              value={
                editingCompany[row.id] ??
                row.company_name ??
                ""
              }
              onValueChange={(v) =>
                setEditingCompany({
                  ...editingCompany,
                  [row.id]: v
                })
              }
            >

              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select Company" />
              </SelectTrigger>

              <SelectContent>

                {companies.map((c) => (

                  <SelectItem
                    key={c.id}
                    value={c.name}
                  >
                    {c.name}
                  </SelectItem>

                ))}

              </SelectContent>

            </Select>

            {/* SAVE */}
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                if (!canVerify) {
                  return toast.error('You do not have permission to update company');
                }
                try {

                  await pickupApi.updateCompany(
                    row.id,
                    {
                      company_name:
                        editingCompany[row.id] ||
                        row.company_name
                    }
                  );

                  toast.success(
                    "Company updated"
                  );

                  fetchData();

                } catch (err) {

                  toast.error(
                    err?.response?.data?.detail ||
                    "Failed to update company"
                  );
                }
              }}
            >
              Save
            </Button>

          </div>
        );
      }
    },
    {
      key: "estimated_weight_mt",
      label: "Estimated WT",
      render: (v) =>
        v ? `${Number(v).toFixed(2)} MT` : "-"
    },

    {
      key: "driver_phone",
      label: "Driver"
    },
    {
      key: "status",
      label: "Status",
      render: (v) => {
        const colors = {
          scheduled: "bg-slate-100 text-slate-700 border-l-4 border-slate-400",
          loading_started: "bg-amber-100 text-amber-800 border-l-4 border-amber-500",
          loaded: "bg-emerald-100 text-emerald-800 border-l-4 border-emerald-500",
          rescheduled: "bg-orange-100 text-orange-800 border-l-4 border-orange-500",
          rejected: "bg-red-100 text-red-800 border-l-4 border-red-500",
          verified: "bg-blue-100 text-blue-800 border-l-4 border-blue-500"
        };

        return (
          <span className={`px-2 py-1 text-xs font-semibold rounded inline-block ${colors[v] || ""}`}>
            {v}
          </span>
        );
      }
    },
    {
      key: "reschedule_reason",
      label: "Reschedule",
      render: (v, row) =>
        row.status === "rescheduled" ? (
          <span className="text-orange-600 text-xs">{v}</span>
        ) : (
          "-"
        )
    },

    {
      key: "actions",
      label: "Actions",
      render: (_, row) => {
        console.log(row)

        // Helper function to format the PO info string exactly as requested
        const getFormattedPoInfo = (poId) => {
          const po = purchaseOrders.find(p => String(p.id) === String(poId));
          if (!po) return "";

          const totalQty = po.total_quantity_mt
            ? `${Number(po.total_quantity_mt).toFixed(2)} MT`
            : "-";

          const poDate = po.client_po_date || po.po_date
            ? new Date(po.client_po_date || po.po_date).toLocaleDateString("en-GB")
            : "-";

          const prefix = po.client_po_number ? `${po.client_po_number} | ` : "";
          return ` (${prefix}${totalQty} | Dated: ${poDate})`;
        };

        // ✅ VERIFY OR VERIFIED STATUS → SHOW DETAILS
        if (row.status === "verify" || row.status === "verified") {
          return (
            <div className="flex flex-col gap-3 min-w-[280px]">
              {/* 📦 Verified Details */}
              <div className="text-xs space-y-1 border rounded-md p-2 bg-gray-50">
                <div>
                  <span className="font-semibold">
                    ({row.purchase_order_no || "-"})
                  </span>

                  {/* Displays information when selected/saved */}
                  <span className="text-blue-500 ml-1 font-medium">
                    {getFormattedPoInfo(row.purchase_order_id)}
                  </span>
                </div>

                <div>
                  <span className="font-semibold">Company:</span>{" "}
                  {row.purchase_order_company_name ||
                    purchaseOrders.find(p => String(p.id) === String(row.purchase_order_id))?.to_company_name || "-"}
                </div>

                <div>
                  <span className="font-semibold">Product:</span>{" "}
                  {row.product_name || "-"}
                </div>

                <div>
                  <span className="font-semibold">Depot:</span>{" "}
                  {row.depot_name || "-"}
                </div>

                <div>
                  <span className="font-semibold">Weight:</span>{" "}
                  {Number(row.weight_mt || 0).toFixed(2)} MT
                </div>

                {row.verified_by_name && (
                  <div>
                    <span className="font-semibold">Verified By:</span>{" "}
                    {row.verified_by_name} on{" "}
                    {row.verified_at
                      ? new Date(row.verified_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                      : "-"}
                  </div>
                )}
              </div>

              {/* 📄 Weight Slips */}
              <div className="flex gap-2 flex-wrap">
                {row.tare_slip_file_id ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(getFileUrl(row.tare_slip_file_id), "_blank")}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Tare Slip
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled={true}>
                    <FileX className="w-4 h-4 mr-1" />
                    No Tare Slip
                  </Button>
                )}
                {row.weight_slips?.length ? (
                  row.weight_slips.map((fileId, i) => (
                    <Button
                      key={i}
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(getFileUrl(fileId), "_blank")}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Slip {i + 1}
                    </Button>
                  ))
                ) : (
                  <Button size="sm" variant="outline" disabled={true}>
                    <FileX className="w-4 h-4 mr-1" />
                    No slips uploaded
                  </Button>
                )}
              </div>
            </div>
          );
        }

        // 🟢 LOADED STATUS → SELECT dropdown FORM
        if (row.status === "loaded") {
          return (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2">
                {/* 📦 PURCHASE ORDER */}
                <Select
                  value={selectedPO[row.id] || ""}
                  onValueChange={(v) => {
                    // set selected PO and validate current entered weight against depot inventory
                    setSelectedPO({ ...selectedPO, [row.id]: v });
                    const po = purchaseOrders.find(p => String(p.id) === String(v));
                    const w = Number(weights[row.id] || 0);
                    const available = getAvailableInventory(po?.depot_id, po?.product_id);
                    if (po && w > available) {
                      setInputErrors({
                        ...inputErrors,
                        [row.id]: `Kindly add inventory STOCK IN to proceed. Depot available: ${available.toFixed(2)} MT.`
                      });
                    } else {
                      const next = { ...inputErrors };
                      delete next[row.id];
                      setInputErrors(next);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select PO" />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseOrders
                      .filter(po => {
                        if (po.status === 'Completed') return false;
                        const pickupCompany = (row.company_name || "").trim().toLowerCase();
                        const poCompany = (po.to_company_name || "").trim().toLowerCase();
                        return pickupCompany === poCompany;
                      })
                      .map((po) => {
                        const totalQty = po.total_quantity_mt ? `${Number(po.total_quantity_mt).toFixed(2)} MT` : "-";
                        const poDate = po.client_po_date || po.po_date
                          ? new Date(po.client_po_date || po.po_date).toLocaleDateString("en-GB")
                          : "-";

                        return (
                          <SelectItem key={po.id} value={po.id}>
                            <div className="flex flex-col text-left">
                              {/* Main Row showing formatted label inside dropdown list */}
                              <span className="font-medium text-blue-600">
                                {po.client_po_number || po.po_number} <span className="text-xs font-normal text-blue-500">({totalQty} | Dated: {poDate})</span>
                              </span>
                              {/* Secondary info row */}
                              <span className="text-[11px] text-gray-500 mt-0.5">
                                {po.product_name} • {po.depot_name} • {po.to_company_name || "Unknown"} • Remaining: {(po.remaining_quantity_mt || 0).toFixed(2)} MT
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>

                {/* ⚖️ WEIGHT INPUT */}
                <div>
                  <Input
                    placeholder="Weight"
                    type="number"
                    value={weights[row.id] || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setWeights({ ...weights, [row.id]: val });

                      // validate against selected PO depot inventory
                      const poId = selectedPO[row.id];
                      const po = purchaseOrders.find(p => String(p.id) === String(poId));
                      const w = Number(val || 0);
                      const available = getAvailableInventory(po?.depot_id, po?.product_id);
                      if (po && w > available) {
                        setInputErrors({
                          ...inputErrors,
                          [row.id]: `Kindly add inventory STOCK IN to proceed. Depot available: ${available.toFixed(2)} MT.`
                        });
                      } else {
                        const next = { ...inputErrors };
                        delete next[row.id];
                        setInputErrors(next);
                      }
                    }}
                  />
                  {inputErrors[row.id] && (
                    <div className="text-xs text-red-600 mt-1">{inputErrors[row.id]}</div>
                  )}
                </div>

                {/* 📋 TARE SLIP */}
                {row.tare_slip_file_id ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(getFileUrl(row.tare_slip_file_id), '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Tare Slip
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={true}
                  >
                    <FileX className="w-4 h-4 mr-1" />
                    No Tare Slip
                  </Button>
                )}

                {/* 📤 MULTIPHOTO FILE UPLOAD */}
                <MultiPhotoUpload
                  value={files[row.id] || []}
                  onChange={(photos) => setFiles({ ...files, [row.id]: photos })}
                />

                {/* ✅ VERIFY BUTTON */}
                <Button
                  size="sm"
                  onClick={() => handleVerify(row)}
                  disabled={uploading || Boolean(inputErrors[row.id]) || !canVerify}
                >
                  Verify
                </Button>
              </div>
            </div>
          );
        }

        return "-";
      }
    },
    {
      key: "weight_difference",
      label: "Est. Wt. - Act. Wt.",
      render: (_, row) => {
        const estimated = Number(row.estimated_weight_mt || 0);
        const actual = Number(row.weight_mt || 0);
        if (!row.weight_mt) {
          return "-";
        }
        const diff = estimated - actual;
        const diffFormatted = `${diff.toFixed(2)} MT`;
        return (
          <span className={diff >= 0 ? "text-red-600" : "text-green-600"}>
            {diffFormatted}
          </span>
        );
      }
    },
  ];

  const filteredData = data.filter((row) => {

    // status
    if (
      statusFilter !== "all" &&
      row.status !== statusFilter
    ) {
      return false;
    }

    // transporter
    if (
      transporterFilter !== "all" &&
      row.transporter_name !== transporterFilter
    ) {
      return false;
    }

    // company
    const companyName =
      row.purchase_order_company_name ||
      row.company_name ||
      purchaseOrders.find(
        p => String(p.id) === String(row.purchase_order_id)
      )?.to_company_name;

    if (
      companyFilter !== "all" &&
      companyName !== companyFilter
    ) {
      return false;
    }

    return true;
  });

  const statusPriority = {
    scheduled: 1,
    loading_started: 2,
    loaded: 3,
    verified: 4,
    rescheduled: 5,
    rejected: 6
  };

  const sortedData = [...filteredData].sort((a, b) => {
    const pa = statusPriority[a.status] || 99;
    const pb = statusPriority[b.status] || 99;
    if (pa !== pb) return pa - pb;
    return new Date(b.date || 0) - new Date(a.date || 0);
  });

  // 📊 Stats
  const stats = {
    total: filteredData.length,
    loaded: filteredData.filter(d => d.status === "loaded").length,
    verified: filteredData.filter(d => d.status === "verified").length,
    rescheduled: filteredData.filter(d => d.status === "rescheduled").length
  };

  if (!canView) {
    return (
      <PageLayout title="Verify Dispatch">
        <div className="p-8 text-center text-gray-500">
          No permission
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Verify Dispatch"
      subtitle="Verify depot dispatches and deduct inventory"
    // actions={
    // }
    >

      <FilterPanel
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        setTransporterFilter={setTransporterFilter}
        companyFilter={companyFilter}
        setCompanyFilter={setCompanyFilter}
        uniqueTransporters={uniqueTransporters}
        uniqueCompanies={uniqueCompanies}
        transporterFilter={transporterFilter}
      />
      {/* ====================================================================== */}

      {/* 📊 Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`w-full rounded-xl border p-0 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusFilter === "all" ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}
        >
          <Card className="border-0 bg-transparent shadow-none rounded-none">
            <CardContent className="pt-5">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("loaded")}
          className={`w-full rounded-xl border p-0 transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${statusFilter === "loaded" ? "border-emerald-600 bg-emerald-100" : "border-slate-200 bg-emerald-50/50 hover:border-emerald-400 hover:bg-emerald-100"}`}
        >
          <Card className="border-0 bg-transparent shadow-none rounded-none">
            <CardContent className="pt-5">
              <p className="text-xs text-emerald-600">Loaded</p>
              <p className="text-2xl font-bold text-emerald-700">
                {stats.loaded}
              </p>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("verified")}
          className={`w-full rounded-xl border p-0 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusFilter === "verified" ? "border-blue-600 bg-blue-100" : "border-slate-200 bg-blue-50/50 hover:border-blue-400 hover:bg-blue-100"}`}
        >
          <Card className="border-0 bg-transparent shadow-none rounded-none">
            <CardContent className="pt-5">
              <p className="text-xs text-blue-600">Verified</p>
              <p className="text-2xl font-bold text-blue-700">
                {stats.verified}
              </p>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("rescheduled")}
          className={`w-full rounded-xl border p-0 transition focus:outline-none focus:ring-2 focus:ring-orange-500 ${statusFilter === "rescheduled" ? "border-orange-600 bg-orange-100" : "border-slate-200 bg-orange-50/50 hover:border-orange-400 hover:bg-orange-100"}`}
        >
          <Card className="border-0 bg-transparent shadow-none rounded-none">
            <CardContent className="pt-5">
              <p className="text-xs text-orange-600">Rescheduled</p>
              <p className="text-2xl font-bold text-orange-700">
                {stats.rescheduled}
              </p>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* ====================================================================== */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="pl-8"
            aria-label="Start date"
          />
        </div>
        <span className="text-sm font-medium text-gray-500">to</span>
        <div className="relative">
          <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="pl-8"
            aria-label="End date"
          />
        </div>
      </div>

      {/* ====================================================================== */}

      <VerifyPickupOrdersDataTable
        columns={columns}
        data={sortedData}
        loading={loading}
        emptyMessage="No pickups found"
      />
    </PageLayout>
  );
}