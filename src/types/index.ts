export type UserRole = "ADMIN" | "MANAGER" | "STAFF";

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: string[];
}

export interface PaginatedResponse<T = any> {
  total: number;
  page: number;
  page_size: number;
  pages: number;
  items: T[];
}

export interface HealthCheckResponse {
  status: string;
  service: string;
  environment: string;
  database: string;
  timestamp: string;
  version: string;
}

export interface NavItem {
  name: string;
  href: string;
  icon: string;
  badge?: string | number;
  subItems?: { name: string; href: string }[];
}

// Dashboard Types
export interface KPIStats {
  total_orders: number;
  orders_growth_pct: number;
  total_sales: number;
  sales_growth_pct: number;
  pending_orders: number;
  preparing_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  low_stock_count: number;
  platform_orders: Record<string, number>;
  platform_sales: Record<string, number>;
  platform_sales_pct: Record<string, number>;
}

export interface SalesTrendPoint {
  date: string;
  day: string;
  total: number;
  zomato: number;
  swiggy: number;
  website: number;
  orders_count: number;
}

export interface TopSellingItem {
  item_name: string;
  portion_size: string;
  quantity_sold: number;
  total_revenue: number;
  share_pct: number;
}

export interface LowStockAlert {
  id: number;
  name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  reorder_level: number;
  unit: string;
  is_critical: boolean;
}

export interface RecentOrderSummary {
  id: number;
  order_number: string;
  platform: string;
  customer_name: string;
  customer_phone: string;
  items_summary?: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
  created_at: string;
  time_formatted: string;
}

export interface DashboardData {
  kpis: KPIStats;
  sales_trend: SalesTrendPoint[];
  top_selling_items: TopSellingItem[];
  low_stock_alerts: LowStockAlert[];
  recent_orders: RecentOrderSummary[];
}

// Phase 4 Order Types
export type OrderPlatform = "WEBSITE" | "ZOMATO" | "SWIGGY";

export type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface OrderItem {
  id: number;
  order_id: number;
  item_name: string;
  portion_size: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at?: string;
}

export interface OrderStatusHistory {
  id: number;
  order_id: number;
  previous_status?: string | null;
  new_status: string;
  changed_by_name: string;
  notes?: string | null;
  created_at: string;
}

export interface CustomerBrief {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  default_address?: string | null;
  total_orders: number;
  total_spent: number;
}

export interface Order {
  id: number;
  order_number: string;
  platform: OrderPlatform | string;
  customer_id?: number | null;
  customer_name: string;
  customer_phone: string;
  delivery_address?: string | null;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  tax: number;
  total_amount: number;
  order_status: OrderStatus | string;
  payment_status: PaymentStatus | string;
  items_summary?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  items_count: number;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  status_history: OrderStatusHistory[];
  customer?: CustomerBrief | null;
  platform_display: string;
  estimated_commission: number;
}

export interface OrderStatusSummary {
  total_orders: number;
  new: number;
  confirmed: number;
  preparing: number;
  ready: number;
  out_for_delivery: number;
  delivered: number;
  cancelled: number;
  today_orders: number;
  today_revenue: number;
}

export interface CreateOrderItemInput {
  item_name: string;
  portion_size: string;
  quantity: number;
  unit_price: number;
}

export interface CreateOrderInput {
  platform: OrderPlatform;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address?: string;
  items: CreateOrderItemInput[];
  discount?: number;
  delivery_fee?: number;
  payment_status?: PaymentStatus;
  notes?: string;
}

// Phase 5: Public Website Order Gateway Types
export interface WebsiteOrderItemInput {
  item_name: string;
  portion_size: string;
  quantity: number;
  unit_price: number;
  notes?: string;
}

export interface WebsiteCustomerInput {
  name: string;
  phone: string;
  email?: string;
  delivery_address: string;
}

export interface WebsiteOrderCreateRequest {
  customer: WebsiteCustomerInput;
  items: WebsiteOrderItemInput[];
  payment_method: string;
  delivery_fee?: number;
  discount?: number;
  notes?: string;
}

export interface WebsiteOrderCreateResponse {
  order_number: string;
  order_status: string;
  payment_status: string;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  tax: number;
  total_amount: number;
  estimated_delivery_minutes: number;
  tracking_token: string;
  created_at: string;
}

export interface TrackingTimelineStep {
  step_key: string;
  label: string;
  description: string;
  completed: boolean;
  current: boolean;
  timestamp?: string | null;
}

export interface PublicOrderTrackResponse {
  order_number: string;
  order_status: string;
  status_display: string;
  payment_status: string;
  customer_name: string;
  customer_phone_masked: string;
  delivery_address: string;
  items_summary: string;
  items_count: number;
  total_amount: number;
  created_at: string;
  estimated_delivery_minutes: number;
  timeline: TrackingTimelineStep[];
}

export interface PaymentWebhookRequest {
  payment_status: string;
  transaction_id?: string;
  payment_gateway?: string;
  notes?: string;
}

export interface PaymentWebhookResponse {
  success: boolean;
  order_number: string;
  previous_payment_status: string;
  new_payment_status: string;
  order_status: string;
  message: string;
}

export interface GatewayHealthResponse {
  status: string;
  service: string;
  version: string;
  platform: string;
}

// Phase 6: Menu Management Types
export interface MenuItemPortion {
  id?: number;
  menu_item_id?: number;
  portion_size: string;
  weight_grams?: number | null;
  serves_persons?: string | null;
  cost_price: number;
  base_price: number;
  original_price?: number | null;
  zomato_price: number;
  swiggy_price: number;
  is_available: boolean;
  profit_margin_percent?: number;
}

export interface MenuItemPortionInput {
  id?: number;
  portion_size: string;
  weight_grams?: number;
  serves_persons?: string;
  cost_price: number;
  base_price: number;
  original_price?: number;
  zomato_price?: number;
  swiggy_price?: number;
  is_available?: boolean;
}

export interface MenuCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  items_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface MenuCategoryInput {
  name: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface MenuItem {
  id: number;
  category_id: number;
  category_name?: string;
  name: string;
  slug: string;
  description?: string | null;
  is_veg: boolean;
  spice_level: "MILD" | "MEDIUM" | "SPICY" | "EXTRA_SPICY" | string;
  preparation_time_minutes: number;
  image_url?: string | null;
  badge?: string | null;
  metadata_json?: string | null;
  is_available: boolean;
  is_active: boolean;
  display_order: number;
  starting_price: number;
  portions: MenuItemPortion[];
  created_at?: string;
  updated_at?: string;
}

export interface MenuItemInput {
  category_id: number;
  name: string;
  description?: string;
  is_veg: boolean;
  spice_level: string;
  preparation_time_minutes: number;
  image_url?: string;
  badge?: string;
  metadata_json?: string;
  is_available?: boolean;
  is_active?: boolean;
  display_order?: number;
  portions: MenuItemPortionInput[];
}

export interface MenuSummary {
  total_items: number;
  total_categories: number;
  veg_items_count: number;
  non_veg_items_count: number;
  available_items_count: number;
  out_of_stock_count: number;
}

export interface PlatformPriceCalculation {
  base_price: number;
  website_price: number;
  zomato_price: number;
  swiggy_price: number;
  zomato_markup_percent: number;
  swiggy_markup_percent: number;
}

// Phase 7 Inventory Types
export type InventoryCategory =
  | "GRAIN"
  | "MEAT"
  | "DAIRY"
  | "VEGETABLE"
  | "SPICE"
  | "OIL"
  | "PACKAGING"
  | "OTHER";

export type InventoryTransactionType =
  | "STOCK_IN"
  | "STOCK_OUT"
  | "WASTAGE"
  | "AUDIT_CORRECTION";

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  reorder_level: number;
  purchase_price: number;
  supplier?: string | null;
  storage_location?: string | null;
  description?: string | null;
  is_active: boolean;
  is_low_stock: boolean;
  is_critical_stock: boolean;
  total_valuation: number;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryItemInput {
  name: string;
  sku?: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  reorder_level: number;
  purchase_price: number;
  supplier?: string;
  storage_location?: string;
  description?: string;
  is_active?: boolean;
}

export interface InventoryTransaction {
  id: number;
  inventory_item_id: number;
  item_name?: string;
  item_sku?: string;
  item_unit?: string;
  item_category?: string;
  transaction_type: InventoryTransactionType | string;
  quantity: number;
  stock_before: number;
  stock_after: number;
  unit_price?: number;
  total_cost?: number;
  reference_no?: string;
  notes?: string;
  performed_by_id?: number;
  performed_by_name?: string;
  created_at: string;
}

export interface InventoryTransactionInput {
  transaction_type: InventoryTransactionType | string;
  quantity: number;
  unit_price?: number;
  reference_no?: string;
  notes?: string;
}

export interface CategoryValuation {
  category: string;
  item_count: number;
  total_valuation: number;
}

export interface InventorySummary {
  total_items: number;
  in_stock_items: number;
  low_stock_items: number;
  critical_stock_items: number;
  out_of_stock_items: number;
  total_inventory_value_inr: number;
  category_valuations: CategoryValuation[];
}

// Phase 8: Packaging Management Types
export type PackagingCategory =
  | "CONTAINER"
  | "BAG"
  | "ACCOMPANIMENT"
  | "CUTLERY"
  | "SEALING_LABEL"
  | "OTHER";

export type PackagingTransactionType =
  | "STOCK_IN"
  | "STOCK_OUT"
  | "WASTAGE"
  | "ORDER_CONSUMPTION"
  | "AUDIT_CORRECTION";

export interface PackagingItem {
  id: number;
  name: string;
  sku: string;
  category: PackagingCategory | string;
  material: string;
  capacity?: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  reorder_level: number;
  purchase_cost: number;
  supplier?: string;
  storage_location?: string;
  description?: string;
  is_active: boolean;
  is_low_stock: boolean;
  is_critical_stock: boolean;
  total_valuation: number;
  created_at?: string;
  updated_at?: string;
}

export interface PackagingItemInput {
  name: string;
  sku?: string;
  category: PackagingCategory | string;
  material: string;
  capacity?: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  reorder_level: number;
  purchase_cost: number;
  supplier?: string;
  storage_location?: string;
  description?: string;
  is_active: boolean;
}

export interface PackagingTransaction {
  id: number;
  packaging_item_id: number;
  item_name?: string;
  item_sku?: string;
  item_unit?: string;
  item_category?: string;
  transaction_type: PackagingTransactionType | string;
  quantity: number;
  stock_before: number;
  stock_after: number;
  unit_cost?: number;
  total_cost?: number;
  order_id?: number;
  reference_no?: string;
  notes?: string;
  performed_by_id?: number;
  performed_by_name?: string;
  created_at: string;
}

export interface PackagingTransactionInput {
  transaction_type: PackagingTransactionType | string;
  quantity: number;
  unit_cost?: number;
  order_id?: number;
  reference_no?: string;
  notes?: string;
}

export interface PackagingConsumptionRule {
  id: number;
  dish_category?: string;
  portion_size?: string;
  packaging_item_id: number;
  packaging_item_name?: string;
  packaging_item_sku?: string;
  packaging_item_unit?: string;
  packaging_item_cost?: number;
  quantity_per_order_unit: number;
  description?: string;
  is_active: boolean;
  created_at?: string;
}

export interface PackagingConsumptionRuleInput {
  dish_category?: string;
  portion_size?: string;
  packaging_item_id: number;
  quantity_per_order_unit: number;
  description?: string;
  is_active: boolean;
}

export interface PackagingOrderSimulationItem {
  dish_category: string;
  portion_size?: string;
  quantity: number;
}

export interface PackagingOrderSimulationResponse {
  consumed_items: {
    packaging_item_id: number;
    item_name: string;
    item_sku: string;
    category: string;
    unit: string;
    units_consumed: number;
    unit_cost: number;
    total_cost: number;
  }[];
  total_packaging_units: number;
  total_packaging_cost_inr: number;
}

export interface CategoryPackagingValuation {
  category: string;
  item_count: number;
  total_valuation: number;
}

export interface PackagingSummary {
  total_items: number;
  in_stock_items: number;
  low_stock_items: number;
  critical_stock_items: number;
  out_of_stock_items: number;
  total_packaging_value_inr: number;
  category_valuations: CategoryPackagingValuation[];
  daily_consumption_units: number;
  daily_consumption_cost_inr: number;
}

// ==================== PHASE 9: RESTOCK & NOTIFICATIONS ====================

export type NotificationType =
  | "LOW_STOCK"
  | "CRITICAL_STOCK"
  | "OUT_OF_STOCK"
  | "RESTOCK_PO"
  | "ORDER_ALERT"
  | "SYSTEM";

export type NotificationSeverity = "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  entity_type?: string;
  entity_id?: number;
  is_read: boolean;
  channel: string;
  channel_status: string;
  recipient?: string;
  metadata_json?: string;
  created_at: string;
  read_at?: string;
}

export type NotificationChannel = "IN_APP" | "WHATSAPP" | "EMAIL" | "SMS";
export type RestockOrderStatus = "DRAFT" | "ORDERED" | "RECEIVED" | "CANCELLED";
export type RestockOrderTarget = "INVENTORY" | "PACKAGING" | "MIXED";

export interface NotificationSummary {
  total_notifications: number;
  unread_count: number;
  critical_count: number;
  warning_count: number;
  stock_alert_count: number;
  order_alert_count: number;
}

export interface NotificationDispatchResult {
  notification_id: number;
  channel: string;
  recipient: string;
  status: string;
  preview_content: string;
  action_url?: string;
  whatsapp_url?: string;
  email_mailto?: string;
  rendered_body?: string;
  dispatched_at: string;
}

export interface RestockOrderItemInput {
  item_type: "INVENTORY" | "PACKAGING";
  item_id: number;
  item_name?: string;
  ordered_quantity: number;
  unit_cost?: number;
  unit?: string;
  target_type?: "INVENTORY" | "PACKAGING";
  target_id?: number;
  quantity?: number;
  unit_price_inr?: number;
}

export interface RestockOrderItem {
  id: number;
  restock_order_id: number;
  item_type: "INVENTORY" | "PACKAGING";
  item_id: number;
  item_name: string;
  item_sku?: string;
  unit: string;
  current_stock?: number;
  reorder_threshold?: number;
  suggested_quantity?: number;
  ordered_quantity: number;
  unit_cost: number;
  total_cost: number;
  is_received: boolean;
  // Aliases for convenience in UI components
  target_type?: "INVENTORY" | "PACKAGING";
  target_id?: number;
  quantity?: number;
  unit_price_inr?: number;
  subtotal_inr?: number;
}

export interface RestockOrder {
  id: number;
  po_number: string;
  supplier_name: string;
  supplier_contact?: string;
  status: RestockOrderStatus;
  target_type: RestockOrderTarget;
  total_estimated_cost: number;
  notes?: string;
  created_by_name: string;
  ordered_at?: string;
  received_at?: string;
  received_date?: string;
  expected_date?: string;
  total_amount_inr?: number;
  created_at: string;
  items: RestockOrderItem[];
}

export interface RestockSuggestionItem {
  item_type: "INVENTORY" | "PACKAGING";
  item_id: number;
  name: string;
  sku: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  reorder_level: number;
  purchase_cost: number;
  suggested_order_qty: number;
  estimated_cost: number;
  supplier?: string;
  status: "OUT_OF_STOCK" | "CRITICAL" | "LOW_STOCK";
  // Aliases for convenience in UI components
  item_name?: string;
  target_type?: "INVENTORY" | "PACKAGING";
  target_id?: number;
  reorder_threshold?: number;
  critical_threshold?: number;
  suggested_reorder_qty?: number;
  estimated_unit_cost_inr?: number;
  estimated_total_cost_inr?: number;
  supplier_name?: string;
}

export interface RestockSummary {
  total_deficit_items: number;
  critical_items_count: number;
  low_stock_items_count: number;
  estimated_restock_investment_inr: number;
  open_pos_count: number;
  received_pos_count: number;
}

// ── Phase 10: Customer CRM ──────────────────────────────────────
export type CustomerSegment = "NEW" | "REGULAR" | "VIP" | "LAPSED";

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  default_address?: string;
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  segment: CustomerSegment;
  notes?: string;
  last_order_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerOrderBrief {
  id: number;
  order_number: string;
  platform: string;
  order_status: string;
  total_amount: number;
  items_summary?: string;
  items_count: number;
  created_at: string;
}

export interface CustomerDetail extends Customer {
  recent_orders: CustomerOrderBrief[];
  preferred_platform?: string;
  preferred_item?: string;
}

export interface CustomerSummary {
  total_customers: number;
  new_customers: number;
  vip_customers: number;
  regular_customers: number;
  lapsed_customers: number;
  total_revenue: number;
  average_order_value: number;
}

export interface CustomerUpdate {
  name?: string;
  email?: string;
  default_address?: string;
  notes?: string;
}

// ── Phase 11 & 12: Analytics, Reports & Costing ──────────────────────────────
export interface SalesTrendItem {
  date: string;
  day: string;
  total_revenue: number;
  website_revenue: number;
  zomato_revenue: number;
  swiggy_revenue: number;
  order_count: number;
  avg_order_value: number;
}

export interface SalesTrendResponse {
  items: SalesTrendItem[];
  total_period_revenue: number;
  total_period_orders: number;
  average_order_value: number;
}

export interface TopItemMetric {
  item_id: number;
  item_name: string;
  category_name: string;
  quantity_sold: number;
  total_revenue: number;
  percentage_of_total: number;
}

export interface TopItemsResponse {
  items: TopItemMetric[];
  total_items_sold: number;
  total_revenue: number;
}

export interface PlatformBreakdownMetric {
  platform: string;
  display_name: string;
  revenue: number;
  order_count: number;
  avg_order_value: number;
  revenue_share_pct: number;
  commission_rate_pct: number;
  commission_amount: number;
  net_revenue: number;
}

export interface PlatformBreakdownResponse {
  platforms: PlatformBreakdownMetric[];
  total_gross_revenue: number;
  total_commission: number;
  total_net_revenue: number;
}

export interface HourlyVelocityCell {
  day_of_week: number;
  day_name: string;
  hour: number;
  order_count: number;
  revenue: number;
}

export interface OrderVelocityResponse {
  cells: HourlyVelocityCell[];
  peak_hour: number;
  peak_day: string;
  max_orders_in_slot: number;
  total_orders_analyzed: number;
}

export interface CustomerSegmentMetric {
  segment: string;
  customer_count: number;
  percentage: number;
  total_spent: number;
  avg_spent_per_customer: number;
}

export interface CustomerSegmentsResponse {
  segments: CustomerSegmentMetric[];
  total_customers: number;
  total_revenue: number;
}

export interface DishMarginMetric {
  item_id: number;
  item_name: string;
  category_name: string;
  selling_price: number;
  food_cost: number;
  packaging_cost: number;
  avg_commission: number;
  net_margin_amount: number;
  gross_margin_pct: number;
  is_low_margin: boolean;
}

export interface DishCostingResponse {
  dishes: DishMarginMetric[];
  avg_kitchen_margin_pct: number;
  low_margin_count: number;
}

export interface PLSummaryResponse {
  gross_revenue: number;
  ingredient_food_cost: number;
  packaging_cost: number;
  platform_commissions: number;
  total_cogs: number;
  gross_profit: number;
  gross_profit_margin_pct: number;
  orders_count: number;
}

// ── Phase 13: Integrations & Webhooks ─────────────────────────────
export interface IntegrationConfig {
  id: number;
  platform: string;
  is_enabled: boolean;
  store_id?: string;
  api_key_masked?: string;
  api_key?: string;
  webhook_secret?: string;
  auto_accept: boolean;
  environment: string;
  status: "CONNECTED" | "DEGRADED" | "DISCONNECTED";
  last_sync_at?: string;
  orders_synced_today: number;
  sync_interval_minutes: number;
  shop_open?: boolean;
  created_at: string;
  updated_at: string;
}

export interface IntegrationLog {
  id: number;
  platform: string;
  event_type: string;
  status: string;
  payload_snippet?: string;
  message?: string;
  created_at: string;
}

export interface IntegrationHealthSummary {
  platforms: IntegrationConfig[];
  overall_status: string;
  total_synced_today: number;
  active_platforms_count: number;
}

export interface WebhookSimulateRequest {
  platform: string;
  event_type?: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  items?: { item_name: string; quantity: number; unit_price: number }[];
  total_amount?: number;
}

// ── Phase 15: Business Hours & Holidays ───────────────────────────
export interface BusinessHourDay {
  id: number;
  day_of_week: number;
  day_name: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

export interface BusinessHourDayUpdate {
  is_open?: boolean;
  open_time?: string;
  close_time?: string;
}

export interface BusinessHoursConfig {
  auto_schedule_enabled: boolean;
  force_open_now: boolean;
  timezone: string;
  holiday_message?: string | null;
  updated_at: string;
}

export interface BusinessHoliday {
  id: number;
  holiday_date: string;
  is_closed: boolean;
  open_time?: string | null;
  close_time?: string | null;
  reason?: string | null;
  created_at: string;
}

export interface BusinessHolidayInput {
  holiday_date: string;
  is_closed?: boolean;
  open_time?: string | null;
  close_time?: string | null;
  reason?: string | null;
}

export interface BusinessHoursRead {
  config: BusinessHoursConfig;
  days: BusinessHourDay[];
  holidays: BusinessHoliday[];
}

// ── Phase 14: Audit & Compliance ───────────────────────────────────
export interface AuditLog {
  id: number;
  user_id?: number;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface AuditStats {
  total_logs: number;
  today_logs: number;
  by_action: Record<string, number>;
  by_entity: Record<string, number>;
}



// ── Phase 16: Website Storefront ───────────────────────────────────
export interface StorefrontConfig {
  id: number;
  logo_url: string | null;
  banner_url: string | null;
  banner_mobile_url: string | null;
  gift_section_enabled: boolean;
  gift_bg_url: string | null;
  bulk_bg_url: string | null;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  delivery_fee: number;
  free_delivery_enabled: boolean;
  free_delivery_threshold: number;
  brand_name: string | null;
  brand_tagline: string | null;
  address_line: string | null;
  area: string | null;
  city: string | null;
  pincode: string | null;
  google_maps_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  operating_hours: string | null;
}

export interface PaymentMethodConfig {
  id: number;
  key: string;
  label: string;
  description: string | null;
  enabled: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PromoCode {
  id: number;
  code: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  discount_type: string;
  discount_value: number;
  free_item_name: string | null;
  min_order_value: number;
  badge: string | null;
  active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  max_uses: number | null;
  used_count: number;
  per_user_limit: number;
  applicable_items: string[] | null;
  minimum_order_items: number | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  customer_name: string;
  location: string | null;
  rating: number;
  review_text: string;
  verified_order: boolean;
  dish_loved: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DeliveryArea {
  id: number;
  name: string;
  pincode: string;
  delivery_fee: number;
  estimated_minutes: number;
  min_order: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContactInquiry {
  id: number;
  inquiry_type: "contact" | "bulk";
  name: string;
  phone: string | null;
  email: string | null;
  subject: string | null;
  message: string | null;
  details_json: string | null;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
}
