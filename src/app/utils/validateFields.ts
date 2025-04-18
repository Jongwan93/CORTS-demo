export interface VsaValidationContext {
  isALSSelected: boolean;
  isVSASelected: boolean;
  incidentCallNumber: string | null;
  requiredFieldsSelector?: string;
}

// unified required check
export function validateRequiredFields(
  selector: string = '[required]'
): boolean {
  const reqFields = document.querySelectorAll(selector);
  for (let field of reqFields) {
    const inputField = field as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;
    if (!inputField.value) {
      console.error('Required field not filled:', field);
      alert('Error: Not all required fields are filled in.');
      return false;
    }
  }
  return true;
}

// Incident(Call)# validation
export function validateIncidentCallNumber(
  context: VsaValidationContext
): boolean {
  if (!context.incidentCallNumber || context.incidentCallNumber.trim() === '') {
    alert('Please enter incident(Call)#');
    return false;
  }
  return true;
}

// ALS or VSA selected?
export function validateVsaTypeSelection(
  context: VsaValidationContext
): boolean {
  if (context.isALSSelected || context.isVSASelected) {
    return true;
  } else {
    alert('You must select either ALS, VSA or both.');
    return false;
  }
}

// when VSA is selected, check if "pronounced by" is filled
export function validateVsaPronouncedBy(context: VsaValidationContext): boolean {
  if (context.isVSASelected) {
    const pronouncedInput = document.getElementById('pronouncedBy') as HTMLInputElement;
    if (!pronouncedInput || !pronouncedInput.value.trim()) {
      alert('For a VSA, you must enter the name of the pronouncing doctor if you enter a VSA date. Otherwise, leave both of these fields blank.');
      return false;
    }
  }
  return true;
}

// VSA report validation
export function validateVsaReport(context: VsaValidationContext): boolean {
  const requiredValid = validateRequiredFields(context.requiredFieldsSelector);
  const callNumberValid = validateIncidentCallNumber(context);
  const typeSelectionValid = validateVsaTypeSelection(context);
  const pronouncedByValid = validateVsaPronouncedBy(context);

  return requiredValid && callNumberValid && typeSelectionValid && pronouncedByValid;
}


