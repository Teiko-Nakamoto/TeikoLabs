import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ACCESS_SETTINGS_FILE = path.join(process.cwd(), 'access-settings.json');

// Default settings
const DEFAULT_SETTINGS = {
  createProject: true,
  lockUnlock: true, 
  claimRevenue: true,
  tokenTrading: {
    featured: false,
    practice: false,
    allProjects: false
  }
};

// Helper function to read settings
function readSettings() {
  try {
    if (fs.existsSync(ACCESS_SETTINGS_FILE)) {
      const data = fs.readFileSync(ACCESS_SETTINGS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error reading access settings:', error);
    return DEFAULT_SETTINGS;
  }
}

// Helper function to write settings
function writeSettings(settings) {
  try {
    fs.writeFileSync(ACCESS_SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing access settings:', error);
    return false;
  }
}

// GET - Retrieve current access settings
export async function GET() {
  try {
    const settings = readSettings();
    return NextResponse.json({ 
      success: true, 
      settings 
    });
  } catch (error) {
    console.error('GET access settings error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to retrieve access settings' 
    }, { status: 500 });
  }
}

// POST - Update access settings
export async function POST(request) {
  try {
    const { settings } = await request.json();
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid settings data' 
      }, { status: 400 });
    }

    // Validate settings structure
    const validKeys = ['createProject', 'lockUnlock', 'claimRevenue'];
    const validatedSettings = {};
    
    for (const key of validKeys) {
      if (key in settings) {
        validatedSettings[key] = Boolean(settings[key]);
      }
    }

    // Handle tokenTrading object separately
    if (settings.tokenTrading && typeof settings.tokenTrading === 'object') {
      validatedSettings.tokenTrading = {
        featured: Boolean(settings.tokenTrading.featured),
        practice: Boolean(settings.tokenTrading.practice),
        allProjects: Boolean(settings.tokenTrading.allProjects)
      };
    }

    // Merge with existing settings
    const currentSettings = readSettings();
    const updatedSettings = { ...currentSettings, ...validatedSettings };

    const success = writeSettings(updatedSettings);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        settings: updatedSettings,
        message: 'Access settings updated successfully'
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save access settings' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('POST access settings error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update access settings' 
    }, { status: 500 });
  }
}
