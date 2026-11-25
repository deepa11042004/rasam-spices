/**
 * Shapes of the records returned by the backend API. Timestamps arrive as ISO
 * strings and are revived to Date by the API client (src/lib/api.ts).
 */

export type ProductRecord = {
  id: string;
  slug: string | null;
  name: string;
  category: string;
  description: string | null;
  tagline: string | null;
  imageSrc: string | null;
  imageAlt: string | null;
  backImageSrc: string | null;
  backImageAlt: string | null;
  /** JSON column: normally string[]. */
  packSizes: unknown;
  packFormat: string | null;
  pendingNote: string | null;
  isVisible: boolean;
  isFeatured: boolean;
  dishPhotoSrc: string | null;
  dishPhotoAlt: string | null;
  dishPhotoFocus: string | null;
  dishPhotoZoom: number | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

type EnquiryBase = {
  id: string;
  status: string;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type GeneralEnquiryRecord = EnquiryBase & {
  fullName: string;
  companyName: string | null;
  email: string;
  mobileNumber: string;
  enquiryType: string;
  subject: string;
  message: string;
};

export type BusinessEnquiryRecord = EnquiryBase & {
  contactPerson: string;
  businessName: string;
  businessEmail: string;
  mobileNumber: string;
  businessType: string;
  businessLocation: string;
  website: string | null;
  gstin: string | null;
  /** JSON column: array of selected products. */
  products: unknown;
  message: string | null;
};

export type SampleRequestRecord = EnquiryBase & {
  fullName: string;
  companyName: string | null;
  email: string;
  mobileNumber: string;
  customerType: string;
  /** JSON column: array of selected products. */
  products: unknown;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  message: string | null;
};

export type EnquiryKind = "general" | "business" | "sample";

export type CompanySettingsRecord = {
  id: string;
  companyName: string;
  email: string | null;
  address: string | null;
  fssaiNumber: string | null;
  phone: string | null;
  phoneHref: string | null;
  brandLine: string | null;
  launchDate: string | null;
  websiteDisplay: string | null;
  websiteHref: string | null;
  siteDescription: string | null;
  footerTagline: string | null;
  updatedAt: Date;
};

export type SocialLinkRecord = {
  id: string;
  platform: string;
  url: string;
  isVisible: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type SiteContentRecord = {
  id: string;
  key: string;
  title: string | null;
  content: string;
  updatedAt: Date;
};

export type Paged<T> = { items: T[]; total: number };
