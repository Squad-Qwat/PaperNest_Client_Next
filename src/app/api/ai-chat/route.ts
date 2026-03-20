import { NextResponse } from 'next/server'

export async function POST() {
	return NextResponse.json(
		{ error: 'AI Chat route is deprecated. Use ai-stream instead.' },
		{ status: 404 }
	)
}

export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	})
}

