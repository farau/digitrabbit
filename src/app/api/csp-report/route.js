// app/api/csp-report/route.js (pour App Router)

import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const report = await request.json();

        // Log de base dans la console
        console.log('🚨 CSP Violation Report:', {
            timestamp: new Date().toISOString(),
            userAgent: request.headers.get('user-agent'),
            report: report
        });

        // Détails spécifiques de la violation
        if (report['csp-report']) {
            const cspReport = report['csp-report'];
            console.log('📋 Violation Details:', {
                blockedUri: cspReport['blocked-uri'],
                violatedDirective: cspReport['violated-directive'],
                originalPolicy: cspReport['original-policy'],
                sourceFile: cspReport['source-file'],
                lineNumber: cspReport['line-number']
            });
        }

        // Optionnel : Envoyer vers un service de monitoring
        if (process.env.NODE_ENV === 'production') {
            //await sendToMonitoringService(report);
        }

        return NextResponse.json({ message: 'Report received' }, { status: 200 });
    } catch (error) {
        console.error('Error processing CSP report:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// Fonction optionnelle pour envoyer vers un service de monitoring
async function sendToMonitoringService(report) {
    // Exemple avec un webhook
    if (process.env.WEBHOOK_URL) {
        try {
            await fetch(process.env.WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: `🚨 CSP Violation: ${report['csp-report']?.['violated-directive']}`
                })
            });
        } catch (error) {
            console.error('Failed to send to webhook:', error);
        }
    }
}