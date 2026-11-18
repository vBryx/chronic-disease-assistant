# What changed

## Version 0.2.3

### Changes

- **Strip:** the strip is shorter. Each item now uses one line for the name, one for the state, and one for the latest result or reason.
- **Strip:** the small SCREENING and FOLLOW-UP labels are removed. The cell name already ends in "screening" or "follow-up".
- **Strip:** a long reason ends with "…". Select the cell to read all of it, including the value and date.
- **Medicines:** each medicine appears once, with its most recent current order. Before this version, a medicine could appear once for each dose.
- **Medicines:** different doses ordered on the same day, such as a morning and a night insulin dose, appear together in the row.
- **Medicines:** medicines are grouped like the results: Diabetes, Blood pressure and heart, Lipids, Blood thinners, Thyroid, and Other.

## Version 0.2.1

### Corrections

- **Colon cancer:** the FIT result is now read correctly. A FIT report in Raqeem has several lines, and most of them are empty. Before this version, the Assistant could read an empty line and show **RESULT NOT VALID – REPEAT** although the report was negative or positive. The Assistant now reads every line of the report. A weak positive result counts as positive. The result is not valid only when no line shows a negative or positive result.
- **CKD screening:** hypertension or heart disease now starts CKD screening only when the diagnosis was recorded at two or more visits, or is marked as chronic in Raqeem. A diagnosis recorded at one visit only, and not marked as chronic, no longer makes CKD screening due. Diabetes and coded CKD follow-up are unchanged.
- **Strip:** the round status symbols in the strip are smaller.

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
