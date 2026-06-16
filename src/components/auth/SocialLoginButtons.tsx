'use client'

import { FaGithub } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'
import { MicrosoftIconIcon } from '@/components/icons/logos-microsoft-icon'
import { Button } from '@/components/ui/button'

type Provider = 'google' | 'github' | 'microsoft'

interface Props {
	onLogin: (provider: Provider) => void
	disabled?: boolean
	labels: { google: string; github: string; microsoft: string; or: string }
}

export function SocialLoginButtons({ onLogin, disabled, labels }: Props) {
	return (
		<>
			<div className='grid grid-cols-3 gap-3 sm:grid-cols-1'>
				<Button
					type='button'
					variant='outline'
					onClick={() => onLogin('google')}
					disabled={disabled}
				>
					<FcGoogle />
					<span className='hidden sm:inline'>{labels.google}</span>
				</Button>
				<Button
					type='button'
					variant='outline'
					onClick={() => onLogin('github')}
					disabled={disabled}
				>
					<FaGithub />
					<span className='hidden sm:inline'>{labels.github}</span>
				</Button>
				<Button
					type='button'
					variant='outline'
					onClick={() => onLogin('microsoft')}
					disabled={disabled}
				>
					<MicrosoftIconIcon />
					<span className='hidden sm:inline'>{labels.microsoft}</span>
				</Button>
			</div>
			<div className='relative'>
				<div className='absolute inset-0 flex items-center'>
					<div className='w-full border-t border-border' />
				</div>
				<div className='relative flex justify-center text-sm'>
					<span className='px-4 bg-background text-muted-foreground'>{labels.or}</span>
				</div>
			</div>
		</>
	)
}
