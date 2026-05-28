/**
 * Billing Service
 * Handles billing and payment API calls to the backend
 */

import { apiClient } from '../clients/api-client'

class BillingService {
	/**
	 * Create a checkout session for Lemon Squeezy
	 */
	async createCheckoutSession(variantId: string): Promise<{ url: string; id: string }> {
		return apiClient.post<{ url: string; id: string }>('/billing/checkout', { variantId })
	}

	/**
	 * Retrieve the customer portal URL
	 */
	async getCustomerPortal(): Promise<{ portalUrl: string }> {
		return apiClient.get<{ portalUrl: string }>('/billing/portal')
	}
}

export const billingService = new BillingService()
