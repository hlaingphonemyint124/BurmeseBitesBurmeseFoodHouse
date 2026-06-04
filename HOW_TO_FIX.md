# Fix Blank Screen — 3 Steps

## Root Cause
`package.json` had `@rollup/rollup-linux-x64-gnu` (a Linux-only binary)
hardcoded as a dependency. This silently breaks Vite on macOS.

## Fix

Open Terminal, drag your project folder into it, then run:

```bash
# 1. Go to your project folder
cd /path/to/BurmeseBites_BurmeseResturantWeb

# 2. Replace package.json with the fixed one from this zip
#    (copy the package.json from this zip into your project root)

# 3. Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# 4. Start
npm run dev
```

## Or use the script
Double-click `FIX_AND_START.sh` or drag it into Terminal and press Enter.
It does all steps automatically.
