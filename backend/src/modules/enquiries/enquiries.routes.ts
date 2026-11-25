import { Router } from "express";
import { handler, param, queryString } from "@/lib/async-handler";
import { requireAdmin } from "@/middleware/auth";
import * as enquiries from "./enquiries.service";

/** Public submissions from the Contact page. Mounted at /api/enquiries. */
export const publicEnquiriesRouter = Router();

publicEnquiriesRouter.post(
  "/business",
  handler(async (req, res) => {
    res.json(await enquiries.submitBusinessEnquiry(req.body));
  }),
);

publicEnquiriesRouter.post(
  "/general",
  handler(async (req, res) => {
    res.json(await enquiries.submitGeneralEnquiry(req.body));
  }),
);

publicEnquiriesRouter.post(
  "/sample",
  handler(async (req, res) => {
    res.json(await enquiries.submitSampleRequest(req.body));
  }),
);

/** Admin CRM. Mounted at /api/admin/enquiries; :kind is general | business | sample. */
export const adminEnquiriesRouter = Router();
adminEnquiriesRouter.use(requireAdmin);

adminEnquiriesRouter.use("/:kind", (req, res, next) => {
  if (!enquiries.isEnquiryKind(param(req, "kind"))) {
    res.status(404).json({ ok: false, message: "Unknown enquiry type" });
    return;
  }
  next();
});

adminEnquiriesRouter.get(
  "/:kind",
  handler(async (req, res) => {
    const kind = param(req, "kind") as enquiries.EnquiryKind;
    const page = Math.max(1, Number(queryString(req, "page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(queryString(req, "pageSize")) || 20));
    res.json(
      await enquiries.listEnquiries(kind, {
        q: queryString(req, "q").trim(),
        status: queryString(req, "status"),
        type: queryString(req, "type"),
        page,
        pageSize,
      }),
    );
  }),
);

adminEnquiriesRouter.get(
  "/:kind/:id",
  handler(async (req, res) => {
    const record = await enquiries.getEnquiry(param(req, "kind") as enquiries.EnquiryKind, param(req, "id"));
    if (!record) {
      res.status(404).json({ ok: false, message: "Not found" });
      return;
    }
    res.json(record);
  }),
);

adminEnquiriesRouter.patch(
  "/:kind/:id/status",
  handler(async (req, res) => {
    res.json(
      await enquiries.setEnquiryStatus(param(req, "kind") as enquiries.EnquiryKind, param(req, "id"), req.body?.status),
    );
  }),
);

adminEnquiriesRouter.patch(
  "/:kind/:id/notes",
  handler(async (req, res) => {
    res.json(
      await enquiries.setEnquiryNotes(param(req, "kind") as enquiries.EnquiryKind, param(req, "id"), req.body?.notes),
    );
  }),
);
