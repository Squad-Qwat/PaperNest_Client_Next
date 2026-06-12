import type * as React from 'react'

interface PaperNestLoaderProps extends React.SVGProps<SVGSVGElement> {
	width?: number | string
	height?: number | string
}

export function PaperNestLoader({ width = 64, height = 64, className, ...props }: PaperNestLoaderProps) {
	return (
		<svg
			viewBox='0 0 200 200'
			width={width}
			height={height}
			className={className}
			xmlns='http://www.w3.org/2000/svg'
			aria-label='Loading...'
			{...props}
		>
			<style>{`
        .hex { fill:none; stroke:#009689; stroke-width:6;
               stroke-linecap:round; stroke-linejoin:round;
               stroke-dasharray:330; stroke-dashoffset:330; }
        #h1 { animation: draw 1.4s cubic-bezier(.4,0,.2,1) infinite; }
        #h2 { animation: draw 1.4s cubic-bezier(.4,0,.2,1) .28s infinite; }
        #h3 { animation: draw 1.4s cubic-bezier(.4,0,.2,1) .56s infinite; }
        @keyframes draw {
          0%   { stroke-dashoffset:330; opacity:.15; }
          20%  { opacity:1; }
          60%  { stroke-dashoffset:0; opacity:1; }
          85%  { stroke-dashoffset:0; opacity:.6; }
          100% { stroke-dashoffset:0; opacity:.15; }
        }
      `}</style>
			<g transform='translate(12,12) scale(2.75)'>
				<path
					id='h1'
					className='hex'
					d='M17.33 1.138L7.184 6.995A2.7 2.7 0 0 0 5.168 9.787V22.202A2.7 2.7 0 0 0 7.184 24.993L17.33 30.85A2.7 2.7 0 0 0 19.345 31.228 2.7 2.7 0 0 0 21.36 30.85L31.507 24.993A2.7 2.7 0 0 0 33.522 22.202V9.787A2.7 2.7 0 0 0 31.507 6.995L21.36 1.138A2.7 2.7 0 0 0 19.345.598 2.7 2.7 0 0 0 17.33 1.138Z'
				/>
				<path
					id='h2'
					className='hex'
					d='M17.491 31.768L7.345 37.625A2.7 2.7 0 0 0 5.33 40.416V52.832A2.7 2.7 0 0 0 7.345 55.622L17.491 61.48A2.7 2.7 0 0 0 19.506 62.72 2.7 2.7 0 0 0 21.521 62.18L31.668 56.322A2.7 2.7 0 0 0 33.683 53.531V41.115A2.7 2.7 0 0 0 31.668 38.325L21.521 31.768A2.7 2.7 0 0 0 19.506 31.228 2.7 2.7 0 0 0 17.491 31.768Z'
				/>
				<path
					id='h3'
					className='hex'
					d='M42.64 17.259L32.493 23.116A2.7 2.7 0 0 0 30.478 25.907V38.323A2.7 2.7 0 0 0 32.493 41.113L42.64 46.971A2.7 2.7 0 0 0 44.655 47.869 2.7 2.7 0 0 0 46.67 47.671L56.817 41.813A2.7 2.7 0 0 0 58.832 39.022V26.606A2.7 2.7 0 0 0 56.817 23.816L46.67 17.959A2.7 2.7 0 0 0 44.655 16.719 2.7 2.7 0 0 0 42.64 17.259Z'
				/>
			</g>
		</svg>
	)
}
