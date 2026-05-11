# Evolving Therapy & Wellness — Deployment & File Structure Guide

## Local Folder Structure (on your computer)

```
Downloads/
└── evolving-therapy-website/
    ├── index.html
    ├── resources.html
    ├── patient-portal.html
    ├── blog.html
    ├── token-chart.html
    ├── hep-generator.html
    ├── wbv-hep.html
    ├── thank-you.html
    ├── [all other HTML files]
    └── downloads/  ← CRITICAL FOLDER
        ├── Module_1_Business_Setup.zip
        ├── Module_2_Client_Intake.zip
        ├── OT_Eval_Template.docx (customers download this)
        ├── OT_Eval_Template.pdf (full, for reference)
        ├── OT_Eval_Template_Preview.pdf (2 pages, for preview link)
        ├── Job_Readiness_Interactive_Workbook.docx
        ├── Job_Readiness_Interactive_Workbook.pdf
        ├── Job_Readiness_Preview.pdf (2 pages, for preview link)
        ├── handwriting_sheets.pdf
        ├── WBVHEP_pdf_2.pdf
        └── Relationships_Curriculum_Young_Adult__1_.docx
```

## Claude's Working Locations

- **Claude edits files in:** `/mnt/project/` (mirrors your local folder)
- **Claude saves outputs to:** `/mnt/user-data/outputs/` (for you to download)

## Deployment Workflow

### Step 1: Claude builds/edits files
- Claude works in `/mnt/project/`
- Claude copies final versions to `/mnt/user-data/outputs/`

### Step 2: Vanessa downloads and organizes
- Download files from `/mnt/user-data/outputs/`
- Place HTML files in `Downloads/evolving-therapy-website/`
- Place product files in `Downloads/evolving-therapy-website/downloads/`

### Step 3: Push to GitHub/Netlify
- Commit all changes locally
- Push to GitHub, OR
- Drag the entire `evolving-therapy-website` folder into Netlify Deploy tab

## Preview PDFs

Preview PDFs **must be in the downloads folder** on Netlify:
- They go in: `Downloads/evolving-therapy-website/downloads/`
- They're accessed at: `https://evolving-therapy-wellness.netlify.app/downloads/[filename]`

Examples:
- `https://evolving-therapy-wellness.netlify.app/downloads/OT_Eval_Template_Preview.pdf`
- `https://evolving-therapy-wellness.netlify.app/downloads/Job_Readiness_Preview.pdf`

## PayPal Purchase Flow

1. Customer buys product on resources.html
2. PayPal processes payment
3. **All products redirect to:** `https://evolving-therapy-wellness.netlify.app/thank-you.html`
4. **thank-you.html should:**
   - Display a "Thank you for your purchase!" message
   - Provide download links OR collect email for download link
   - Link to their specific product files from the `downloads/` folder

Example download links on thank-you.html:
```
https://evolving-therapy-wellness.netlify.app/downloads/OT_Eval_Template.docx
https://evolving-therapy-wellness.netlify.app/downloads/Module_1_Business_Setup.zip
https://evolving-therapy-wellness.netlify.app/downloads/Module_2_Client_Intake.zip
https://evolving-therapy-wellness.netlify.app/downloads/Job_Readiness_Interactive_Workbook.docx
```

## Current Products & Files

| Product | Customer Download | Preview Link | Location |
|---------|------------------|--------------|----------|
| OT Eval Template | OT_Eval_Template.docx | OT_Eval_Template_Preview.pdf | downloads/ |
| Handwriting Pack | handwriting_sheets.pdf | (no preview) | downloads/ |
| Job Readiness | Job_Readiness_Interactive_Workbook.docx | Job_Readiness_Preview.pdf | downloads/ |
| Module 1+2 Bundle | Module_1_Business_Setup.zip<br>Module_2_Client_Intake.zip | (no preview) | downloads/ |
| Token Chart | (free tool) | (direct link) | token-chart.html |

## Important Notes

- **All preview PDFs are limited** (2 pages max) to prevent full bypass
- **Handwriting has NO preview** (even 1 page can be saved and bypassed paywall)
- **All downloads come from the downloads/ folder** on Netlify
- **thank-you.html is the single redirect point** for all PayPal purchases

## Questions for Clarification

- [ ] Does thank-you.html collect customer email before showing downloads?
- [ ] Or does it show download buttons directly?
- [ ] Should there be a unique download link per product type?
