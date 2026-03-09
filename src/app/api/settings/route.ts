import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/settings - Get all settings grouped
export async function GET() {
  try {
    const settings = await db.setting.findMany({
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });

    // Group settings by group
    const groupedSettings: Record<string, Record<string, any>> = {};

    settings.forEach((setting) => {
      if (!groupedSettings[setting.group]) {
        groupedSettings[setting.group] = {};
      }

      // Parse value based on type
      let parsedValue: any = setting.value;
      switch (setting.type) {
        case 'number':
          parsedValue = setting.value ? parseFloat(setting.value) : null;
          break;
        case 'boolean':
          parsedValue = setting.value === 'true';
          break;
        case 'json':
          try {
            parsedValue = setting.value ? JSON.parse(setting.value) : null;
          } catch {
            parsedValue = setting.value;
          }
          break;
      }

      groupedSettings[setting.group][setting.key] = {
        value: parsedValue,
        type: setting.type,
        label: setting.label,
      };
    });

    return NextResponse.json({
      success: true,
      data: groupedSettings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener la configuración' },
      { status: 500 }
    );
  }
}
