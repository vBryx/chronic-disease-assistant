# What changed

## Version 0.2.0

This is the first public version of **Chronic Disease Assistant**.

### What doctors can see

- A screening and follow-up strip for DM, Dyslipidemia, Colon cancer, and CKD.
- Clear states for due, due soon, screened, up to date, pending, invalid, unread, and not eligible.
- Follow-up for coded diabetes, dyslipidemia, statin treatment, diabetes kidney checks, and CKD.
- Care gaps grouped as Safety check, Treat, Order, Refer, and Confirm diagnosis.
- Laboratory results from the last three years, with graphs and Raqeem normal ranges.
- Blood pressure, BMI, and weight graphs.
- A complete available medicine list.
- eGFR, FIB-4, Mentzer, and PREVENT results.
- A link to the official Saudi FRAX calculator with available values shown for manual entry.
- Screening codes for DM, Dyslipidemia, and Colon cancer after doctor confirmation.

### Safety changes

- Invalid or unread results never appear as screened.
- Missing information is shown as **COULD NOT READ RESULT**.
- The Assistant checks diagnoses before adding screening codes.
- The Assistant checks the Diagnosis list again after adding.
- Changing the patient or visit stops any remaining additions.
- Patient information stays in Raqeem.

### Moving from the old assistant

Remove **Raqeem Screening Assistant** before using this version. If both are present, Chronic Disease Assistant shows a removal notice and does not open the strip.
