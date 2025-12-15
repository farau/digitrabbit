import { NextResponse } from 'next/server';
import fs from 'fs';
import path, { sep } from 'path';

// Parser CSV
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const data = {};

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
        const [addr, count] = lines[i].split(',');
        if (addr && count) {
            data[addr.trim().toLowerCase()] = parseInt(count.trim());
        }
    }
    return data;
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { address } = body;

        if (!address) {
            return NextResponse.json(
                { error: 'Address is required' },
                { status: 400 }
            );
        }

        // Chemins vers les fichiers CSV (dans le dossier data/ à la racine du projet)
        const flufflesPath = path.join(process.cwd(), 'data', 'fluffles.csv');
        const gtdPath = path.join(process.cwd(), 'data', 'gtd.csv');
        const fcfsPath = path.join(process.cwd(), 'data', 'fcfs.csv');

        // Vérifier que les fichiers existent
        if (!fs.existsSync(gtdPath) || !fs.existsSync(fcfsPath) || !fs.existsSync(flufflesPath)) {
            return NextResponse.json(
                { error: 'Whitelist data not found' },
                { status: 500 }
            );
        }

        // Lire les fichiers
        const flufflesText = fs.readFileSync(flufflesPath, 'utf-8');
        const gtdText = fs.readFileSync(gtdPath, 'utf-8');
        const fcfsText = fs.readFileSync(fcfsPath, 'utf-8');

        // Parser les CSV
        const flufflesData = parseCSV(flufflesText);
        const gtdData = parseCSV(gtdText);
        const fcfsData = parseCSV(fcfsText);


        // Normaliser l'adresse
        const normalizedAddress = address.toLowerCase();

        // Préparer la réponse
        const response = {
            fluffles: {
                isWhitelisted: normalizedAddress in flufflesData,
                count: flufflesData[normalizedAddress] || 0,
            },
            gtd: {
                isWhitelisted: normalizedAddress in gtdData,
                count: gtdData[normalizedAddress] || 0,
            },
            fcfs: {
                isWhitelisted: normalizedAddress in fcfsData,
                count: fcfsData[normalizedAddress] || 0
            }
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error checking whitelist:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}