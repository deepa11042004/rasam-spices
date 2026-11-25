/**
 * Read helpers for the admin pages: list/detail queries answered by the
 * backend. Every call forwards the admin session token.
 */
import { api, apiOrNull } from "@/lib/api";
import type {
  BusinessEnquiryRecord,
  CompanySettingsRecord,
  EnquiryKind,
  GeneralEnquiryRecord,
  Paged,
  ProductRecord,
  SampleRequestRecord,
  SiteContentRecord,
  SocialLinkRecord,
} from "@/lib/api-types";

type EnquiryRecordByKind = {
  general: GeneralEnquiryRecord;
  business: BusinessEnquiryRecord;
  sample: SampleRequestRecord;
};

export function listEnquiries<K extends EnquiryKind>(
  kind: K,
  query: { q?: string; status?: string; type?: string; page: number; pageSize: number },
): Promise<Paged<EnquiryRecordByKind[K]>> {
  return api(`/api/admin/enquiries/${kind}`, { admin: true, query });
}

export function getEnquiry<K extends EnquiryKind>(
  kind: K,
  id: string,
): Promise<EnquiryRecordByKind[K] | null> {
  return apiOrNull(`/api/admin/enquiries/${kind}/${encodeURIComponent(id)}`, { admin: true });
}

export function listAdminProducts(query: {
  q?: string;
  category?: string;
  visibility?: string;
  page: number;
  pageSize: number;
}): Promise<Paged<ProductRecord>> {
  return api("/api/admin/products", { admin: true, query });
}

export function getAdminProduct(id: string): Promise<ProductRecord | null> {
  return apiOrNull(`/api/admin/products/${encodeURIComponent(id)}`, { admin: true });
}

export function getAdminSettings(): Promise<{
  settings: CompanySettingsRecord | null;
  socialLinks: SocialLinkRecord[];
  siteContent: SiteContentRecord[];
}> {
  return api("/api/admin/settings", { admin: true });
}
