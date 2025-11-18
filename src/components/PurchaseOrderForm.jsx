import React, { useState } from "react";

// mock data for clients, jobs, talents
const mockClients = {
  "Collabera - Collabera Inc": [
    {
      jobTitle: "Application Development",
      reqId: "OWNAL_234",
      talents: [
        { id: "c1-t1", name: "Monika Goyal" },
        { id: "c1-t2", name: "Shaili Khatri" },
        { id: "c1-t3", name: "Rahul Kumar" },
      ],
    },
    {
      jobTitle: "QA Engineer",
      reqId: "OWNAL_235",
      talents: [
        { id: "c1-q1", name: "Amit Singh" },
        { id: "c1-q2", name: "Nisha Patel" },
      ],
    },
  ],
  "Client B": [
    {
      jobTitle: "Business Administrator",
      reqId: "CLK_12001",
      talents: [
        { id: "c2-b1", name: "Manshur Ali" },
        { id: "c2-b2", name: "Sana Khan" },
        { id: "c2-b3", name: "Karan Verma" },
      ],
    },
  ],
};

// helper to deep clone talent templates for new REQ section
const cloneTalents = (talents) =>
  talents.map((t) => ({
    id: t.id,
    name: t.name,
    selected: false,
    contractDuration: "",
    billRate: "",
    currency: "USD",
    stdTimeBR: "",
    otBR: "",
  }));

export default function PurchaseOrderForm() {
  const [formMode, setFormMode] = useState("edit"); // 'edit' | 'view'
  const [errors, setErrors] = useState([]);

  const [po, setPo] = useState({
    client: "",
    type: "Group",
    poNumber: "",
    receivedOn: "",
    receivedFromName: "",
    receivedFromEmail: "",
    startDate: "",
    endDate: "",
    budget: "",
    currency: "USD",
  });

  // Start with one blank REQ section (jobTitle empty)
  const [reqs, setReqs] = useState([
    {
      id: "req-1",
      jobTitle: "",
      reqId: "",
      talents: [], 
    },
  ]);

  // ---- handlers ----
  function handlePoChange(e) {
    const { name, value } = e.target;
    setPo((p) => ({ ...p, [name]: value }));
    // if client changed, clear REQs (user must pick job titles for the new client)
    if (name === "client") {
      setReqs([
        {
          id: "req-1",
          jobTitle: "",
          reqId: "",
          talents: [],
        },
      ]);
    }
  }

  function handleReqJobChange(sectionId, jobTitle) {
    setReqs((prev) =>
      prev.map((r) => {
        if (r.id !== sectionId) return r;

        if (!jobTitle) {
          return { ...r, jobTitle: "", reqId: "", talents: [] };
        }

        const clientReqs = mockClients[po.client] || [];
        const matched = clientReqs.find((cr) => cr.jobTitle === jobTitle);
        if (!matched) {
          return { ...r, jobTitle, reqId: "", talents: [] };
        }

        return {
          ...r,
          jobTitle: matched.jobTitle,
          reqId: matched.reqId,
          talents: cloneTalents(matched.talents),
        };
      })
    );
  }

  function addReq() {
    const next = reqs.length + 1;
    setReqs((prev) => [
      ...prev,
      {
        id: `req-${next}`,
        jobTitle: "",
        reqId: "",
        talents: [],
      },
    ]);
  }

  function removeReq(id) {
    setReqs((prev) => prev.filter((r) => r.id !== id));
  }

  function toggleTalent(reqId, talentId) {
    setReqs((prev) =>
      prev.map((r) => {
        if (r.id !== reqId) return r;

        // if Individual PO and toggling ON a talent, ensure we unselect other talents
        return {
          ...r,
          talents: r.talents.map((t) => {
            if (t.id !== talentId) {
              if (po.type === "Individual" && !t.selected && t.id === talentId) {
                // not applicable; keep mapping simple below
              }
              return t;
            }
            // flip selected
            const newSelected = !t.selected;
            return { ...t, selected: newSelected };
          }).map((t2, idx, arr) => {
            // after flip: if this is the toggled one and Individual and turned ON, turn others OFF
            const toggled = t2.id === talentId;
            if (po.type === "Individual") {
              const toggledNow = arr.find((a) => a.id === talentId).selected;
              // But we don't have the new 'selected' values yet. Simpler approach: compute from previous
              // Use previous r.talents to determine previous selection:
              return t2;
            }
            return t2;
          }),
        };
      })
    );

    // Simpler second pass: enforce Individual rule by ensuring only one selected per req
    setReqs((prev) =>
      prev.map((r) => {
        if (r.id !== reqId) return r;
        const toggledIndex = r.talents.findIndex((t) => t.id === talentId);
        if (toggledIndex === -1) return r;
        const toggledWasSelected = r.talents[toggledIndex].selected;
        // We toggled it above (but because setState is async we re-derive manually):
        const newTalents = r.talents.map((t, i) => {
          if (t.id === talentId) return { ...t, selected: !t.selected };
          if (po.type === "Individual" && !toggledWasSelected) {
            // if we are turning a talent ON (it was previously false), turn others OFF
            return { ...t, selected: false };
          }
          return t;
        });
        return { ...r, talents: newTalents };
      })
    );
  }

  function handleTalentField(reqId, talentId, field, value) {
    setReqs((prev) =>
      prev.map((r) => {
        if (r.id !== reqId) return r;
        return {
          ...r,
          talents: r.talents.map((t) => (t.id === talentId ? { ...t, [field]: value } : t)),
        };
      })
    );
  }

  // ---- validation ----
  function validateAll() {
    const e = [];

    // PO-level validations
    if (!po.client) e.push("Client Name is required.");
    if (!po.type) e.push("Purchase Order Type is required.");
    if (!po.poNumber) e.push("Purchase Order No. is required.");
    if (!po.receivedOn) e.push("Received On is required.");
    if (!po.receivedFromName) e.push("Received From Name is required.");
    if (!po.receivedFromEmail) e.push("Received From Email is required.");
    else {
      // basic email format check
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(po.receivedFromEmail)) e.push("Received From Email is invalid.");
    }
    if (!po.startDate) e.push("PO Start Date is required.");
    if (!po.endDate) e.push("PO End Date is required.");
    if (po.startDate && po.endDate && po.endDate < po.startDate) e.push("PO End Date cannot be before PO Start Date.");
    if (!po.budget && po.budget !== 0) e.push("Budget is required.");
    if (po.budget && (isNaN(Number(po.budget)) || Number(po.budget) < 0)) e.push("Budget must be a valid number.");
    if (String(po.budget).length > 5) e.push("Budget must be at most 5 digits.");

    // REQ-level validations
    for (let rIndex = 0; rIndex < reqs.length; rIndex++) {
      const r = reqs[rIndex];
      if (!r.jobTitle) {
        e.push(`REQ #${rIndex + 1}: Job Title / REQ Name is required.`);
        continue; // talents not relevant if job not selected
      }
      if (!r.reqId) e.push(`REQ #${rIndex + 1}: REQ ID missing for selected Job Title.`);
      // talents existence
      const selectedTalents = (r.talents || []).filter((t) => t.selected);
      // For each selected talent, ensure mandatory fields are present (contractDuration and billRate as example)
      for (const t of selectedTalents) {
        if (!t.contractDuration) e.push(`REQ ${r.reqId} - Talent ${t.name}: Contract Duration is required.`);
        if (!t.billRate) e.push(`REQ ${r.reqId} - Talent ${t.name}: Bill Rate is required.`);
      }

      if (po.type === "Individual" && selectedTalents.length > 1) {
        e.push(`REQ ${r.reqId}: Individual PO allows only one talent selection.`);
      }
      if (po.type === "Group" && selectedTalents.length < 2) {
        e.push(`REQ ${r.reqId}: Group PO requires at least two talents selected.`);
      }
    }

    return e;
  }

  function onSubmit(e) {
    e.preventDefault();
    const v = validateAll();
    setErrors(v);
    if (v.length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // success
    setFormMode("view");
    setErrors([]);
    console.log("Saved PO:", { po, reqs });
  }

  function onReset() {
    setPo({
      client: "",
      type: "Group",
      poNumber: "",
      receivedOn: "",
      receivedFromName: "",
      receivedFromEmail: "",
      startDate: "",
      endDate: "",
      budget: "",
      currency: "USD",
    });
    setReqs([
      {
        id: "req-1",
        jobTitle: "",
        reqId: "",
        talents: [],
      },
    ]);
    setFormMode("edit");
    setErrors([]);
  }

  // Build client -> job dropdown options
  const clientOptions = Object.keys(mockClients);

  // For a given client, return job list
  const jobOptionsForClient = (client) => {
    if (!client) return [];
    return mockClients[client] || [];
  };

  // Render
  return (
    <div className="po-page container-fluid py-4">
      {errors.length > 0 && (
        <div className="alert alert-danger">
          <strong>Fix these errors before submitting:</strong>
          <ul className="mb-0">
            {errors.map((er, i) => (
              <li key={i}>{er}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="po-header d-flex align-items-center mb-3">
        <button className="back-btn me-3" type="button">←</button>
        <h3>Purchase Order | {formMode === "edit" ? "New" : "View"}</h3>
      </div>

      <form onSubmit={onSubmit} className="po-card p-3">
        {/* Purchase Order Details */}
        <h5>Purchase Order Details</h5>
        <div className="row gx-3 gy-2 align-items-center">
          <div className="col-md-3">
            <label className="form-label small">Client Name *</label>
            {formMode === "view" ? (
              <div className="view-field">{po.client || "-"}</div>
            ) : (
              <select name="client" value={po.client} onChange={handlePoChange} className="form-select">
                <option value="">Select Client</option>
                {clientOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>

          <div className="col-md-2">
            <label className="form-label small">Purchase Order Type *</label>
            {formMode === "view" ? (
              <div className="view-field">{po.type}</div>
            ) : (
              <select name="type" value={po.type} onChange={handlePoChange} className="form-select">
                <option value="Group">Group PO</option>
                <option value="Individual">Individual PO</option>
              </select>
            )}
          </div>

          <div className="col-md-2">
            <label className="form-label small">Purchase Order No. *</label>
            {formMode === "view" ? (
              <div className="view-field">{po.poNumber || "-"}</div>
            ) : (
              <input name="poNumber" value={po.poNumber} onChange={handlePoChange} className="form-control" placeholder="PO Number" />
            )}
          </div>

          <div className="col-md-2">
            <label className="form-label small">Received On *</label>
            {formMode === "view" ? (
              <div className="view-field">{po.receivedOn || "-"}</div>
            ) : (
              <input name="receivedOn" value={po.receivedOn} onChange={handlePoChange} type="date" className="form-control" />
            )}
          </div>

          <div className="col-md-3 d-flex gap-2 justify-content-end">
            {formMode === "edit" && (
              <button type="button" className="btn btn-outline-secondary" onClick={onReset}>Reset</button>
            )}
            {formMode === "edit" ? (
              <button type="submit" className="btn btn-primary">Save</button>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={() => setFormMode("edit")}>Edit</button>
            )}
          </div>

          <div className="col-12 mt-2">
            <div className="row gx-3">
              <div className="col-md-3">
                <label className="form-label small">Received From Name *</label>
                {formMode === "view" ? (
                  <div className="view-field">{po.receivedFromName || "-"}</div>
                ) : (
                  <input name="receivedFromName" value={po.receivedFromName} onChange={handlePoChange} className="form-control" placeholder="Received From Name" />
                )}
              </div>

              <div className="col-md-3">
                <label className="form-label small">Received From Email *</label>
                {formMode === "view" ? (
                  <div className="view-field">{po.receivedFromEmail || "-"}</div>
                ) : (
                  <input name="receivedFromEmail" value={po.receivedFromEmail} onChange={handlePoChange} className="form-control" placeholder="Received From Email" />
                )}
              </div>

              <div className="col-md-2">
                <label className="form-label small">PO Start Date *</label>
                {formMode === "view" ? (
                  <div className="view-field">{po.startDate || "-"}</div>
                ) : (
                  <input name="startDate" value={po.startDate} onChange={handlePoChange} type="date" className="form-control" />
                )}
              </div>

              <div className="col-md-2">
                <label className="form-label small">PO End Date *</label>
                {formMode === "view" ? (
                  <div className="view-field">{po.endDate || "-"}</div>
                ) : (
                  <input name="endDate" value={po.endDate} onChange={handlePoChange} type="date" className="form-control" min={po.startDate || undefined} />
                )}
              </div>

              <div className="col-md-1">
                <label className="form-label small">Budget *</label>
                {formMode === "view" ? (
                  <div className="view-field">{po.budget || "-"}</div>
                ) : (
                  <input name="budget" value={po.budget} onChange={handlePoChange} type="number" min="0" max="99999" className="form-control" />
                )}
              </div>

              <div className="col-md-1">
                <label className="form-label small">Currency</label>
                {formMode === "view" ? (
                  <div className="view-field">{po.currency}</div>
                ) : (
                  <select name="currency" value={po.currency} onChange={handlePoChange} className="form-select">
                    <option value="USD">USD</option>
                    <option value="INR">INR</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Talent Sections */}
        <div className="po-section mt-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">Talent Detail</h5>
            {po.type === "Group" && formMode === "edit" && (
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={addReq}>+ Add Another</button>
            )}
          </div>

          {reqs.map((r, idx) => {
            const jobOptions = jobOptionsForClient(po.client);
            return (
              <div key={r.id} className="req-card mb-3 p-3">
                <div className="req-header d-flex justify-content-between align-items-center">
                  <div className="d-flex gap-3 align-items-center">
                    <div>
                      <label className="form-label small">Job Title / REQ Name *</label>
                      {formMode === "view" ? (
                        <div className="req-field">{r.jobTitle || "-"}</div>
                      ) : (
                        <select className="form-select" value={r.jobTitle} onChange={(e) => handleReqJobChange(r.id, e.target.value)}>
                          <option value="">Select Job/REQ</option>
                          {jobOptions.map((j) => <option key={j.reqId} value={j.jobTitle}>{j.jobTitle}</option>)}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="form-label small">REQ ID / Assignment ID</label>
                      <div className="req-field">{r.reqId || "-"}</div>
                    </div>
                  </div>

                  <div>
                    {formMode === "edit" && (
                      <button type="button" className="btn btn-sm btn-link text-danger" onClick={() => removeReq(r.id)}>🗑️</button>
                    )}
                  </div>
                </div>

                <div className="req-body mt-3">
                  {/* list talents for this req */}
                  {(!r.talents || r.talents.length === 0) && (
                    <div className="text-muted small">Select a Job/REQ to load talents.</div>
                  )}

                  {r.talents && r.talents.map((t) => (
                    <div key={t.id} className="talent-row d-flex align-items-start gap-3 mb-3">
                      <div className="form-check mt-1">
                        {formMode === "view" ? (
                          <input className="form-check-input" type="checkbox" checked={t.selected} readOnly />
                        ) : (
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={t.selected}
                            onChange={() => toggleTalent(r.id, t.id)}
                          />
                        )}
                      </div>

                      <div className="talent-main flex-grow-1">
                        <label className="talent-name">{t.name}</label>

                        {/* show fields only when selected (and mandatory in validation) */}
                        {t.selected ? (
                          <div className="row gx-2 mt-2">
                            <div className="col-sm-3">
                              <input placeholder="Contract Duration (Months)" className="form-control form-control-sm"
                                value={t.contractDuration}
                                disabled={formMode === "view"}
                                onChange={(e) => handleTalentField(r.id, t.id, "contractDuration", e.target.value)}
                              />
                            </div>

                            <div className="col-sm-2">
                              <input placeholder="Bill Rate" className="form-control form-control-sm"
                                value={t.billRate}
                                disabled={formMode === "view"}
                                onChange={(e) => handleTalentField(r.id, t.id, "billRate", e.target.value)}
                              />
                            </div>

                            <div className="col-sm-2">
                              <select className="form-select form-select-sm"
                                value={t.currency}
                                disabled={formMode === "view"}
                                onChange={(e) => handleTalentField(r.id, t.id, "currency", e.target.value)}
                              >
                                <option value="USD">USD</option>
                                <option value="INR">INR</option>
                              </select>
                            </div>

                            <div className="col-sm-2">
                              <input placeholder="Std. Time BR" className="form-control form-control-sm"
                                value={t.stdTimeBR}
                                disabled={formMode === "view"}
                                onChange={(e) => handleTalentField(r.id, t.id, "stdTimeBR", e.target.value)}
                              />
                            </div>

                            <div className="col-sm-2">
                              <input placeholder="Over Time BR" className="form-control form-control-sm"
                                value={t.otBR}
                                disabled={formMode === "view"}
                                onChange={(e) => handleTalentField(r.id, t.id, "otBR", e.target.value)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-muted small mt-2">Not selected</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </form>
    </div>
  );
}
