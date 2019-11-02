import makeCamelCaseFieldName from "./makeCamelCaseFieldName"

describe('makeCamelCaseFieldName', () => {
  it('converts the field name to camel case', () => {
    expect(makeCamelCaseFieldName('your pre-existing work expe$%rience')).toBe('preExistingWorkExperience')
  })
  
  it('tolerates but warns of lack of article', () => {
    expect(makeCamelCaseFieldName("last year's worries")).toBe('lastYearsWorries')
  })

  it('normalises partial camelCase matches', () => {
    expect(makeCamelCaseFieldName('your iPhone plan')).toBe('iphonePlan')
  })
  
  it('passes through a name thats already camelCase', () => {
    expect(makeCamelCaseFieldName('firstName')).toBe('firstName');
  })

  it('passes through a name thats already camelCase and that starts with an article', () => {
    expect(makeCamelCaseFieldName('yourFirstName')).toBe('yourFirstName');
  })
})