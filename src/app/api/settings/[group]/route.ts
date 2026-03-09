import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/settings/[group] - Get settings by group
export async function GET(
  request: Request,
  { params }: { params: Promise<{ group: string }> }
) {
  try {
    const { group } = await params;

    const settings = await db.setting.findMany({
      where: {
        group,
      },
      orderBy: { key: 'asc' },
    });

    // Transform to key-value object
    const settingsMap: Record<string, any> = {};

    settings.forEach((setting) => {
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

      settingsMap[setting.key] = {
        value: parsedValue,
        type: setting.type,
        label: setting.label,
      };
    });

    return NextResponse.json({
      success: true,
      data: settingsMap,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener la configuración' },
      { status: 500 }
    );
  }
}
