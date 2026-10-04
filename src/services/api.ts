import {
  APIResponse,
  CreateOrderInput,
  Customer,
  CustomerDetail,
  CustomerSummary,
  CustomerUpdate,
  CustomerOrderBrief,
  DashboardData,
  HealthCheckResponse,
  Order,
  OrderDetail,
  OrderStatus,
  OrderStatusSummary,
  PaginatedResponse,
  RecentOrderSummary,
  TokenResponse,
  User,
  UserRole,
  WebsiteOrderCreateRequest,
  WebsiteOrderCreateResponse,
  PublicOrderTrackResponse,
  PaymentWebhookRequest,
  PaymentWebhookResponse,
  GatewayHealthResponse,
  MenuCategory,
  MenuCategoryInput,
  MenuItem,
  MenuItemInput,
  MenuSummary,
  PlatformPriceCalculation,
  InventoryItem,
  InventoryItemInput,
  InventoryTransaction,
  InventoryTransactionInput,
  InventorySummary,
  PackagingItem,
  PackagingItemInput,
  PackagingTransaction,
  PackagingTransactionInput,
  PackagingConsumptionRule,
  PackagingConsumptionRuleInput,
  PackagingOrderSimulationItem,
  PackagingOrderSimulationResponse,
  PackagingSummary,
  NotificationItem,
  NotificationSummary,
  NotificationDispatchResult,
  RestockOrder,
  RestockOrderItem,
  RestockSuggestionItem,
  RestockSummary,
  SalesTrendResponse,
  TopItemsResponse,
  PlatformBreakdownResponse,
  OrderVelocityResponse,
  CustomerSegmentsResponse,
  DishCostingResponse,
  PLSummaryResponse,
  IntegrationConfig,
  IntegrationLog,
  IntegrationHealthSummary,
  WebhookSimulateRequest,
  BusinessHoursRead,
  BusinessHoursConfig,
  BusinessHourDay,
  BusinessHourDayUpdate,
  BusinessHoliday,
  BusinessHolidayInput,
  AuditLog,
  AuditStats,
  StorefrontConfig,
  PaymentMethodConfig,
  PromoCode,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("panna_crm_token");
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            (data.errors && data.errors.join(", ")) ||
            data.detail ||
            `Request failed with status ${response.status}`
        );
      }

      return data as T;
    } catch (error: any) {
      console.error(`API Error on ${endpoint}:`, error);
      throw error;
    }
  }

  // Health
  async getHealth(): Promise<HealthCheckResponse> {
    return this.request<HealthCheckResponse>("/health");
  }

  // Auth
  async login(username_or_email: string, password: string): Promise<TokenResponse> {
    return this.request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username_or_email, password }),
    });
  }

  async getMe(): Promise<{ success: boolean; data: User }> {
    return this.request<{ success: boolean; data: User }>("/auth/me");
  }

  async updateProfile(payload: { full_name?: string; phone?: string; email?: string }): Promise<APIResponse<User>> {
    return this.request<APIResponse<User>>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async changePassword(old_password: string, new_password: string): Promise<APIResponse<null>> {
    return this.request<APIResponse<null>>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ old_password, new_password }),
    });
  }

  async logout(): Promise<APIResponse<null>> {
    try {
      return await this.request<APIResponse<null>>("/auth/logout", {
        method: "POST",
      });
    } catch {
      return { success: true, message: "Logged out locally" };
    }
  }

  // Dashboard API
  async getDashboardStats(): Promise<APIResponse<DashboardData>> {
    return this.request<APIResponse<DashboardData>>("/dashboard/stats");
  }

  async getRecentOrders(): Promise<APIResponse<RecentOrderSummary[]>> {
    return this.request<APIResponse<RecentOrderSummary[]>>("/dashboard/recent-orders");
  }

  // User Management
  async getUsers(params: {
    page?: number;
    page_size?: number;
    role?: string;
    is_active?: boolean;
    search?: string;
  } = {}): Promise<PaginatedResponse<User>> {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.page_size) query.append("page_size", String(params.page_size));
    if (params.role) query.append("role", params.role);
    if (params.is_active !== undefined) query.append("is_active", String(params.is_active));
    if (params.search) query.append("search", params.search);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return this.request<PaginatedResponse<User>>(`/users${queryString}`);
  }

  async getUser(id: number): Promise<APIResponse<User>> {
    return this.request<APIResponse<User>>(`/users/${id}`);
  }

  async createUser(payload: {
    email: string;
    username: string;
    full_name: string;
    phone?: string;
    role: UserRole;
    password: string;
    is_active?: boolean;
  }): Promise<APIResponse<User>> {
    return this.request<APIResponse<User>>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateUser(
    id: number,
    payload: {
      email?: string;
      full_name?: string;
      phone?: string;
      role?: UserRole;
      is_active?: boolean;
      password?: string;
    }
  ): Promise<APIResponse<User>> {
    return this.request<APIResponse<User>>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async deleteUser(id: number): Promise<APIResponse<null>> {
    return this.request<APIResponse<null>>(`/users/${id}`, {
      method: "DELETE",
    });
  }

  // Phase 4: Order Management APIs
  async getOrders(params: {
    page?: number;
    page_size?: number;
    platform?: string;
    status?: string;
    payment_status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  } = {}): Promise<PaginatedResponse<Order>> {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.page_size) query.append("page_size", String(params.page_size));
    if (params.platform && params.platform !== "ALL") query.append("platform", params.platform);
    if (params.status && params.status !== "ALL") query.append("status", params.status);
    if (params.payment_status && params.payment_status !== "ALL") query.append("payment_status", params.payment_status);
    if (params.search) query.append("search", params.search);
    if (params.date_from) query.append("date_from", params.date_from);
    if (params.date_to) query.append("date_to", params.date_to);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return this.request<PaginatedResponse<Order>>(`/orders${queryString}`);
  }

  async getOrderSummary(params?: {
    date_from?: string;
    date_to?: string;
    platform?: string;
  }): Promise<APIResponse<OrderStatusSummary>> {
    const query = new URLSearchParams();
    if (params?.date_from) query.append("date_from", params.date_from);
    if (params?.date_to) query.append("date_to", params.date_to);
    if (params?.platform && params.platform !== "ALL") query.append("platform", params.platform);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return this.request<APIResponse<OrderStatusSummary>>(`/orders/summary${queryString}`);
  }

  async getOrderDetails(id: number): Promise<APIResponse<OrderDetail>> {
    return this.request<APIResponse<OrderDetail>>(`/orders/${id}`);
  }

  async createOrder(payload: CreateOrderInput): Promise<APIResponse<OrderDetail>> {
    return this.request<APIResponse<OrderDetail>>("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateOrderStatus(
    id: number,
    new_status: OrderStatus,
    notes?: string
  ): Promise<APIResponse<OrderDetail>> {
    return this.request<APIResponse<OrderDetail>>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ new_status, notes }),
    });
  }

  async cancelOrder(id: number, reason: string): Promise<APIResponse<OrderDetail>> {
    return this.request<APIResponse<OrderDetail>>(`/orders/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  // Phase 5: Website Order Gateway APIs (Public & Simulated Endpoints)
  async getGatewayHealth(): Promise<GatewayHealthResponse> {
    return this.request<GatewayHealthResponse>("/public/orders/gateway/health");
  }

  async submitPublicWebsiteOrder(
    payload: WebsiteOrderCreateRequest
  ): Promise<APIResponse<WebsiteOrderCreateResponse>> {
    return this.request<APIResponse<WebsiteOrderCreateResponse>>("/public/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async trackPublicOrder(
    orderNumber: string
  ): Promise<APIResponse<PublicOrderTrackResponse>> {
    return this.request<APIResponse<PublicOrderTrackResponse>>(
      `/public/orders/track/${encodeURIComponent(orderNumber)}`
    );
  }

  async sendPaymentWebhook(
    orderNumber: string,
    payload: PaymentWebhookRequest
  ): Promise<APIResponse<PaymentWebhookResponse>> {
    return this.request<APIResponse<PaymentWebhookResponse>>(
      `/public/orders/${encodeURIComponent(orderNumber)}/payment-webhook`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  // Phase 6: Menu Management APIs
  async getMenuSummary(): Promise<APIResponse<MenuSummary>> {
    return this.request<APIResponse<MenuSummary>>("/menu/summary");
  }

  async getMenuCategories(isActive?: boolean): Promise<APIResponse<MenuCategory[]>> {
    const query = isActive !== undefined ? `?is_active=${isActive}` : "";
    return this.request<APIResponse<MenuCategory[]>>(`/menu/categories${query}`);
  }

  async createMenuCategory(payload: MenuCategoryInput): Promise<APIResponse<MenuCategory>> {
    return this.request<APIResponse<MenuCategory>>("/menu/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateMenuCategory(
    id: number,
    payload: Partial<MenuCategoryInput>
  ): Promise<APIResponse<MenuCategory>> {
    return this.request<APIResponse<MenuCategory>>(`/menu/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async deleteMenuCategory(id: number): Promise<APIResponse<null>> {
    return this.request<APIResponse<null>>(`/menu/categories/${id}`, {
      method: "DELETE",
    });
  }

  async getMenuItems(params: {
    category_id?: number;
    is_veg?: boolean;
    is_available?: boolean;
    is_active?: boolean;
    search?: string;
  } = {}): Promise<APIResponse<MenuItem[]>> {
    const query = new URLSearchParams();
    if (params.category_id) query.append("category_id", String(params.category_id));
    if (params.is_veg !== undefined) query.append("is_veg", String(params.is_veg));
    if (params.is_available !== undefined) query.append("is_available", String(params.is_available));
    if (params.is_active !== undefined) query.append("is_active", String(params.is_active));
    if (params.search) query.append("search", params.search);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return this.request<APIResponse<MenuItem[]>>(`/menu/items${queryString}`);
  }

  async getMenuItem(id: number): Promise<APIResponse<MenuItem>> {
    return this.request<APIResponse<MenuItem>>(`/menu/items/${id}`);
  }

  async createMenuItem(payload: MenuItemInput): Promise<APIResponse<MenuItem>> {
    return this.request<APIResponse<MenuItem>>("/menu/items", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateMenuItem(
    id: number,
    payload: Partial<MenuItemInput>
  ): Promise<APIResponse<MenuItem>> {
    return this.request<APIResponse<MenuItem>>(`/menu/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async toggleMenuItemAvailability(
    id: number,
    is_available: boolean
  ): Promise<APIResponse<MenuItem>> {
    return this.request<APIResponse<MenuItem>>(`/menu/items/${id}/availability`, {
      method: "PATCH",
      body: JSON.stringify({ is_available }),
    });
  }

  async deleteMenuItem(id: number): Promise<APIResponse<null>> {
    return this.request<APIResponse<null>>(`/menu/items/${id}`, {
      method: "DELETE",
    });
  }

  async calculatePlatformPrices(
    base_price: number
  ): Promise<APIResponse<PlatformPriceCalculation>> {
    return this.request<APIResponse<PlatformPriceCalculation>>("/menu/calculate-prices", {
      method: "POST",
      body: JSON.stringify({ base_price }),
    });
  }

  async getPublicMenu(): Promise<APIResponse<(MenuCategory & { items: MenuItem[] })[]>> {
    return this.request<APIResponse<(MenuCategory & { items: MenuItem[] })[]>>("/public/menu");
  }

  // Phase 7 Inventory Methods
  async getInventorySummary(): Promise<APIResponse<InventorySummary>> {
    return this.request<APIResponse<InventorySummary>>("/inventory/summary");
  }

  async getInventoryItems(params: {
    category?: string;
    status_filter?: string;
    search?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<APIResponse<PaginatedResponse<InventoryItem>>> {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.page_size) query.append("page_size", String(params.page_size));
    if (params.category && params.category !== "ALL") query.append("category", params.category);
    if (params.status_filter && params.status_filter !== "ALL") query.append("status_filter", params.status_filter);
    if (params.search) query.append("search", params.search);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return this.request<APIResponse<PaginatedResponse<InventoryItem>>>(`/inventory/items${queryString}`);
  }

  async getInventoryItem(id: number): Promise<APIResponse<InventoryItem & { recent_transactions: InventoryTransaction[] }>> {
    return this.request<APIResponse<InventoryItem & { recent_transactions: InventoryTransaction[] }>>(`/inventory/items/${id}`);
  }

  async createInventoryItem(payload: InventoryItemInput): Promise<APIResponse<InventoryItem>> {
    return this.request<APIResponse<InventoryItem>>("/inventory/items", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateInventoryItem(
    id: number,
    payload: Partial<InventoryItemInput>
  ): Promise<APIResponse<InventoryItem>> {
    return this.request<APIResponse<InventoryItem>>(`/inventory/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async deleteInventoryItem(id: number): Promise<APIResponse<{ message: string }>> {
    return this.request<APIResponse<{ message: string }>>(`/inventory/items/${id}`, {
      method: "DELETE",
    });
  }

  async adjustStock(
    id: number,
    payload: InventoryTransactionInput
  ): Promise<APIResponse<InventoryTransaction>> {
    return this.request<APIResponse<InventoryTransaction>>(`/inventory/items/${id}/adjust`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getInventoryTransactions(params: {
    item_id?: number;
    transaction_type?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<APIResponse<PaginatedResponse<InventoryTransaction>>> {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.page_size) query.append("page_size", String(params.page_size));
    if (params.item_id) query.append("item_id", String(params.item_id));
    if (params.transaction_type && params.transaction_type !== "ALL") query.append("transaction_type", params.transaction_type);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return this.request<APIResponse<PaginatedResponse<InventoryTransaction>>>(`/inventory/transactions${queryString}`);
  }

  // Phase 8: Packaging Management API Endpoints
  async getPackagingSummary(): Promise<APIResponse<PackagingSummary>> {
    return this.request<APIResponse<PackagingSummary>>("/packaging/summary");
  }

  async getPackagingItems(params: {
    category?: string;
    stock_status?: string;
    material?: string;
    search?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<APIResponse<PaginatedResponse<PackagingItem>>> {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.page_size) query.append("page_size", String(params.page_size));
    if (params.category && params.category !== "ALL") query.append("category", params.category);
    if (params.stock_status && params.stock_status !== "ALL") query.append("stock_status", params.stock_status);
    if (params.material && params.material !== "ALL") query.append("material", params.material);
    if (params.search) query.append("search", params.search);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return this.request<APIResponse<PaginatedResponse<PackagingItem>>>(`/packaging/items${queryString}`);
  }

  async createPackagingItem(payload: PackagingItemInput): Promise<APIResponse<PackagingItem>> {
    return this.request<APIResponse<PackagingItem>>("/packaging/items", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getPackagingItem(id: number): Promise<APIResponse<PackagingItem>> {
    return this.request<APIResponse<PackagingItem>>(`/packaging/items/${id}`);
  }

  async updatePackagingItem(
    id: number,
    payload: Partial<PackagingItemInput>
  ): Promise<APIResponse<PackagingItem>> {
    return this.request<APIResponse<PackagingItem>>(`/packaging/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async deletePackagingItem(id: number): Promise<APIResponse<boolean>> {
    return this.request<APIResponse<boolean>>(`/packaging/items/${id}`, {
      method: "DELETE",
    });
  }

  async adjustPackagingStock(
    id: number,
    payload: PackagingTransactionInput
  ): Promise<APIResponse<PackagingItem>> {
    return this.request<APIResponse<PackagingItem>>(`/packaging/items/${id}/adjust`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getPackagingTransactions(params: {
    packaging_item_id?: number;
    transaction_type?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<APIResponse<PaginatedResponse<PackagingTransaction>>> {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.page_size) query.append("page_size", String(params.page_size));
    if (params.packaging_item_id) query.append("packaging_item_id", String(params.packaging_item_id));
    if (params.transaction_type && params.transaction_type !== "ALL") query.append("transaction_type", params.transaction_type);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return this.request<APIResponse<PaginatedResponse<PackagingTransaction>>>(`/packaging/transactions${queryString}`);
  }

  async getPackagingRules(): Promise<APIResponse<PackagingConsumptionRule[]>> {
    return this.request<APIResponse<PackagingConsumptionRule[]>>("/packaging/rules");
  }

  async createPackagingRule(payload: PackagingConsumptionRuleInput): Promise<APIResponse<PackagingConsumptionRule>> {
    return this.request<APIResponse<PackagingConsumptionRule>>("/packaging/rules", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async deletePackagingRule(id: number): Promise<APIResponse<boolean>> {
    return this.request<APIResponse<boolean>>(`/packaging/rules/${id}`, {
      method: "DELETE",
    });
  }

  async simulateOrderPackaging(items: PackagingOrderSimulationItem[]): Promise<APIResponse<PackagingOrderSimulationResponse>> {
    return this.request<APIResponse<PackagingOrderSimulationResponse>>("/packaging/simulate-order-consumption", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  }

  // ==================== PHASE 9: NOTIFICATIONS & RESTOCK ====================
  async getNotifications(params?: {
    is_read?: boolean;
    type?: string;
    severity?: string;
    page?: number;
    page_size?: number;
  }): Promise<APIResponse<PaginatedResponse<NotificationItem>>> {
    const query = new URLSearchParams();
    if (params?.is_read !== undefined) query.append("is_read", String(params.is_read));
    if (params?.type && params.type !== "ALL") query.append("type", params.type);
    if (params?.severity && params.severity !== "ALL") query.append("severity", params.severity);
    if (params?.page) query.append("page", String(params.page));
    if (params?.page_size) query.append("page_size", String(params.page_size));

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return this.request<APIResponse<PaginatedResponse<NotificationItem>>>(`/notifications${queryString}`);
  }

  async getNotificationUnreadCount(): Promise<APIResponse<{ unread_count: number }>> {
    return this.request<APIResponse<{ unread_count: number }>>("/notifications/unread-count");
  }

  async getNotificationSummary(): Promise<APIResponse<NotificationSummary>> {
    return this.request<APIResponse<NotificationSummary>>("/notifications/summary");
  }

  async markNotificationAsRead(id: number): Promise<APIResponse<NotificationItem>> {
    return this.request<APIResponse<NotificationItem>>(`/notifications/${id}/read`, {
      method: "PATCH",
    });
  }

  async markAllNotificationsAsRead(): Promise<APIResponse<{ updated_count: number }>> {
    return this.request<APIResponse<{ updated_count: number }>>("/notifications/mark-all-read", {
      method: "POST",
    });
  }

  async deleteNotification(id: number): Promise<APIResponse<{ deleted_id: number }>> {
    return this.request<APIResponse<{ deleted_id: number }>>(`/notifications/${id}`, {
      method: "DELETE",
    });
  }

  async scanKitchenStockAlerts(): Promise<APIResponse<{ alerts_generated: number }>> {
    return this.request<APIResponse<{ alerts_generated: number }>>("/notifications/scan", {
      method: "POST",
    });
  }

  async dispatchNotification(
    id: number,
    payload: { channel: string; recipient?: string; custom_message?: string }
  ): Promise<APIResponse<NotificationDispatchResult>> {
    return this.request<APIResponse<NotificationDispatchResult>>(`/notifications/${id}/dispatch`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // RESTOCK PURCHASE ORDERS
  async getRestockSuggestions(target_type?: string): Promise<APIResponse<RestockSuggestionItem[]>> {
    const query = new URLSearchParams();
    if (target_type && target_type !== "ALL") query.append("target_type", target_type);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return this.request<APIResponse<RestockSuggestionItem[]>>(`/restock/suggestions${queryString}`);
  }

  async getRestockSummary(): Promise<APIResponse<RestockSummary>> {
    return this.request<APIResponse<RestockSummary>>("/restock/summary");
  }

  async getRestockOrders(params?: {
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<APIResponse<PaginatedResponse<RestockOrder>>> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "ALL") query.append("status", params.status);
    if (params?.page) query.append("page", String(params.page));
    if (params?.page_size) query.append("page_size", String(params.page_size));

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return this.request<APIResponse<PaginatedResponse<RestockOrder>>>(`/restock/orders${queryString}`);
  }

  async createRestockOrder(payload: {
    supplier_name: string;
    supplier_contact?: string;
    target_type: string;
    notes?: string;
    items: Array<{
      item_type: string;
      item_id: number;
      ordered_quantity: number;
      unit_cost?: number;
    }>;
  }): Promise<APIResponse<RestockOrder>> {
    return this.request<APIResponse<RestockOrder>>("/restock/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getRestockOrderDetails(id: number): Promise<APIResponse<RestockOrder>> {
    return this.request<APIResponse<RestockOrder>>(`/restock/orders/${id}`);
  }

  async updateRestockOrderStatus(id: number, status: string): Promise<APIResponse<RestockOrder>> {
    return this.request<APIResponse<RestockOrder>>(`/restock/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async receiveRestockOrder(id: number): Promise<APIResponse<RestockOrder>> {
    return this.request<APIResponse<RestockOrder>>(`/restock/orders/${id}/receive`, {
      method: "POST",
    });
  }

  // ── Phase 10: Customer CRM ──────────────────────────────────────
  async getCustomerSummary(): Promise<APIResponse<CustomerSummary>> {
    return this.request<APIResponse<CustomerSummary>>("/customers/summary");
  }

  async listCustomers(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    segment?: string;
    sort_by?: string;
  }): Promise<PaginatedResponse<Customer>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.page_size) query.set("page_size", String(params.page_size));
    if (params?.search) query.set("search", params.search);
    if (params?.segment && params.segment !== "ALL") query.set("segment", params.segment);
    if (params?.sort_by) query.set("sort_by", params.sort_by);
    const qs = query.toString();
    return this.request<PaginatedResponse<Customer>>(`/customers${qs ? `?${qs}` : ""}`);
  }

  async getCustomer(id: number): Promise<APIResponse<CustomerDetail>> {
    return this.request<APIResponse<CustomerDetail>>(`/customers/${id}`);
  }

  async updateCustomer(id: number, payload: CustomerUpdate): Promise<APIResponse<Customer>> {
    return this.request<APIResponse<Customer>>(`/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async addCustomerNote(id: number, note: string): Promise<APIResponse<Customer>> {
    return this.request<APIResponse<Customer>>(`/customers/${id}/notes`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
  }

  async getCustomerOrders(
    id: number,
    page = 1,
    page_size = 10,
  ): Promise<PaginatedResponse<CustomerOrderBrief>> {
    return this.request<PaginatedResponse<CustomerOrderBrief>>(
      `/customers/${id}/orders?page=${page}&page_size=${page_size}`,
    );
  }

  async refreshCustomerSegments(): Promise<APIResponse<{ updated: number }>> {
    return this.request<APIResponse<{ updated: number }>>("/customers/refresh-segments", {
      method: "POST",
    });
  }

  // ── Phase 11 & 12: Analytics & Costing ──────────────────────────────
  async getSalesTrend(days = 7): Promise<APIResponse<SalesTrendResponse>> {
    return this.request<APIResponse<SalesTrendResponse>>(`/analytics/sales-trend?days=${days}`);
  }

  async getTopItems(days = 30, limit = 10, sortBy = "revenue"): Promise<APIResponse<TopItemsResponse>> {
    return this.request<APIResponse<TopItemsResponse>>(`/analytics/top-items?days=${days}&limit=${limit}&sort_by=${sortBy}`);
  }

  async getPlatformBreakdown(days = 30): Promise<APIResponse<PlatformBreakdownResponse>> {
    return this.request<APIResponse<PlatformBreakdownResponse>>(`/analytics/platform-breakdown?days=${days}`);
  }

  async getOrderVelocity(days = 30): Promise<APIResponse<OrderVelocityResponse>> {
    return this.request<APIResponse<OrderVelocityResponse>>(`/analytics/order-velocity?days=${days}`);
  }

  async getCustomerSegments(): Promise<APIResponse<CustomerSegmentsResponse>> {
    return this.request<APIResponse<CustomerSegmentsResponse>>("/analytics/customer-segments");
  }

  async getDishCosting(): Promise<APIResponse<DishCostingResponse>> {
    return this.request<APIResponse<DishCostingResponse>>("/analytics/costing/dishes");
  }

  async getPLSummary(days = 30): Promise<APIResponse<PLSummaryResponse>> {
    return this.request<APIResponse<PLSummaryResponse>>(`/analytics/costing/summary?days=${days}`);
  }

  getAnalyticsExportUrl(dataset = "sales", days = 30): string {
    return `${BASE_URL}/analytics/export?dataset=${dataset}&days=${days}`;
  }

  // ── Phase 13: Integrations & Webhooks ─────────────────────────────
  async getIntegrationStatus(): Promise<APIResponse<IntegrationHealthSummary>> {
    return this.request<APIResponse<IntegrationHealthSummary>>("/integrations/status");
  }

  async updateIntegrationConfig(
    platform: string,
    payload: Partial<IntegrationConfig>
  ): Promise<APIResponse<IntegrationConfig>> {
    return this.request<APIResponse<IntegrationConfig>>(`/integrations/${platform}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async triggerIntegrationSync(platform: string): Promise<APIResponse<any>> {
    return this.request<APIResponse<any>>(`/integrations/sync/${platform}`, {
      method: "POST",
    });
  }

  async simulateIntegrationWebhook(payload: WebhookSimulateRequest): Promise<APIResponse<any>> {
    return this.request<APIResponse<any>>("/integrations/simulate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getIntegrationLogs(limit = 50): Promise<APIResponse<IntegrationLog[]>> {
    return this.request<APIResponse<IntegrationLog[]>>(`/integrations/logs?limit=${limit}`);
  }

  // ── Phase 15: Business Hours & Holidays ───────────────────────────
  async getBusinessHours(): Promise<APIResponse<BusinessHoursRead>> {
    return this.request<APIResponse<BusinessHoursRead>>("/business-hours");
  }

  async getPublicShopStatus(): Promise<APIResponse<any>> {
    return this.request<APIResponse<any>>("/public/shop-status");
  }

  async updateBusinessHoursConfig(
    payload: Partial<BusinessHoursConfig>
  ): Promise<APIResponse<BusinessHoursConfig>> {
    return this.request<APIResponse<BusinessHoursConfig>>("/business-hours/config", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async updateBusinessHourDay(
    dayOfWeek: number,
    payload: BusinessHourDayUpdate
  ): Promise<APIResponse<BusinessHourDay>> {
    return this.request<APIResponse<BusinessHourDay>>(`/business-hours/days/${dayOfWeek}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async createBusinessHoliday(
    payload: BusinessHolidayInput
  ): Promise<APIResponse<BusinessHoliday>> {
    return this.request<APIResponse<BusinessHoliday>>("/business-hours/holidays", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateBusinessHoliday(
    id: number,
    payload: Partial<BusinessHolidayInput>
  ): Promise<APIResponse<BusinessHoliday>> {
    return this.request<APIResponse<BusinessHoliday>>(`/business-hours/holidays/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async deleteBusinessHoliday(id: number): Promise<APIResponse<any>> {
    return this.request<APIResponse<any>>(`/business-hours/holidays/${id}`, {
      method: "DELETE",
    });
  }

  // ── Phase 14: Audit & Compliance ───────────────────────────────────
  async getAuditLogs(params?: {
    page?: number;
    page_size?: number;
    action?: string;
    entity_type?: string;
    search?: string;
  }): Promise<PaginatedResponse<AuditLog>> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.page_size) query.set("page_size", String(params.page_size));
    if (params?.action && params.action !== "ALL") query.set("action", params.action);
    if (params?.entity_type && params.entity_type !== "ALL") query.set("entity_type", params.entity_type);
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return this.request<PaginatedResponse<AuditLog>>(`/audit/logs${qs ? `?${qs}` : ""}`);
  }

  async getAuditStats(): Promise<APIResponse<AuditStats>> {
    return this.request<APIResponse<AuditStats>>("/audit/stats");
  }

  async getStorefrontConfig(): Promise<APIResponse<StorefrontConfig>> {
    return this.request<APIResponse<StorefrontConfig>>("/website/config");
  }

  async updateStorefrontConfig(payload: Partial<StorefrontConfig>): Promise<APIResponse<StorefrontConfig>> {
    return this.request<APIResponse<StorefrontConfig>>("/website/config", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async getPaymentMethods(): Promise<APIResponse<PaymentMethodConfig[]>> {
    return this.request<APIResponse<PaymentMethodConfig[]>>("/website/payment-methods");
  }

  async createPaymentMethod(payload: { key: string; label: string; description?: string; enabled?: boolean; display_order?: number }): Promise<APIResponse<PaymentMethodConfig>> {
    return this.request<APIResponse<PaymentMethodConfig>>("/website/payment-methods", { method: "POST", body: JSON.stringify(payload) });
  }

  async updatePaymentMethod(id: number, payload: Partial<PaymentMethodConfig>): Promise<APIResponse<PaymentMethodConfig>> {
    return this.request<APIResponse<PaymentMethodConfig>>(`/website/payment-methods/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
  }

  async deletePaymentMethod(id: number): Promise<APIResponse<null>> {
    return this.request<APIResponse<null>>(`/website/payment-methods/${id}`, { method: "DELETE" });
  }

  async getPromoCodes(): Promise<APIResponse<PromoCode[]>> {
    return this.request<APIResponse<PromoCode[]>>("/website/promocodes");
  }

  async createPromoCode(payload: Partial<PromoCode>): Promise<APIResponse<PromoCode>> {
    return this.request<APIResponse<PromoCode>>("/website/promocodes", { method: "POST", body: JSON.stringify(payload) });
  }

  async updatePromoCode(id: number, payload: Partial<PromoCode>): Promise<APIResponse<PromoCode>> {
    return this.request<APIResponse<PromoCode>>(`/website/promocodes/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
  }

  async deletePromoCode(id: number): Promise<APIResponse<null>> {
    return this.request<APIResponse<null>>(`/website/promocodes/${id}`, { method: "DELETE" });
  }

  async uploadWebsiteImage(file: File): Promise<APIResponse<{ url: string }>> {
    const token = typeof window !== "undefined" ? localStorage.getItem("panna_crm_token") : null;
    const form = new FormData();
    form.append("file", file);
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const res = await fetch(`${base}/website/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.message || "Upload failed");
    return data;
  }
}

export const api = new ApiClient();

