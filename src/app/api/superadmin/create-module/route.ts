import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { moduleName } = await request.json();

    if (!moduleName) {
      return NextResponse.json({ error: 'Module name is required' }, { status: 400 });
    }

    // Slugify the module name for the folder
    const slug = moduleName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (!slug) {
      return NextResponse.json({ error: 'Invalid module name' }, { status: 400 });
    }

    // The physical path to src/app/superadmin/[slug]
    const targetDir = path.join(process.cwd(), 'src', 'app', 'superadmin', slug);

    // Create the directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    } else {
      return NextResponse.json({ error: 'Module folder already exists' }, { status: 400 });
    }

    // Boilerplate content for page.tsx
    const boilerplateCode = `"use client";

import React from "react";

export default function ${moduleName.replace(/[^a-zA-Z0-9]/g, '')}Page() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
          ${moduleName}
        </h1>
        <p className="text-sm font-medium text-stone-500">
          Manage your ${moduleName} settings and data here.
        </p>
      </div>
      
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
        <p className="text-stone-600 font-medium">This module was dynamically generated. Start building your custom UI here!</p>
      </div>
    </div>
  );
}
`;

    // Write the page.tsx file
    fs.writeFileSync(path.join(targetDir, 'page.tsx'), boilerplateCode);

    return NextResponse.json({ success: true, slug });

  } catch (error: any) {
    console.error('Error generating module:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
