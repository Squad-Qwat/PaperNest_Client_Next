'use client'

import { useState } from 'react'
import Turnstile from 'react-turnstile'

interface TurnstileWidgetProps {
	onVerify: (token: string) => void
	theme?: 'light' | 'dark' | 'auto'
}

export function TurnstileWidget({ onVerify, theme = 'auto' }: TurnstileWidgetProps) {
	const [isLoaded, setIsLoaded] = useState(false)
	const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

	if (!siteKey) {
		console.error('Turnstile site key is missing')
		return null
	}

	return (
		<div className={`flex justify-center my-4 ${!isLoaded ? 'hidden' : ''}`}>
			<Turnstile
				sitekey={siteKey}
				onVerify={(token) => {
					onVerify(token)
					setIsLoaded(true)
				}}
				onLoad={() => setIsLoaded(true)}
				onError={() => setIsLoaded(false)}
				onExpire={() => onVerify('')}
				theme={theme}
				fixedSize={true}
			/>
		</div>
	)
}
