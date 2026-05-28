import { useMutation } from '@tanstack/react-query'
import { billingService } from '../services/billing.service'

export function useCreateCheckoutSession() {
	return useMutation({
		mutationFn: (variantId: string) => billingService.createCheckoutSession(variantId),
	})
}

export function useGetCustomerPortal() {
	return useMutation({
		mutationFn: () => billingService.getCustomerPortal(),
	})
}
