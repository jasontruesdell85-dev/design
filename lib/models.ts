export type OrderStatus = "Submitted" | "Reviewed" | "In Production" | "Completed" | "Cancelled";

export type OrderInsert = {
  product_id: string;
  product_name: string;
  orientation?: string | null;
  deceased_name: string;
  memorial_dates?: string | null;
  theme_style?: string | null;
  colors?: string | null;
  religious_or_spiritual_elements?: string | null;
  hobbies_interests_places?: string | null;
  quote_or_message?: string | null;
  general_instructions?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  shipping_address_line_1: string;
  shipping_address_line_2?: string | null;
  shipping_city: string;
  shipping_region: string;
  shipping_postal_code: string;
  shipping_country: string;
  customer_notes?: string | null;
  approved_artwork_url?: string | null;
  approved_mockup_url?: string | null;
  internal_notes?: string | null;
};
