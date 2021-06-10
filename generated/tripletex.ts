import * as rt from 'runtypes';
import { buildCall } from 'typical-fetch';

function pickQueryValues<T extends Record<string, unknown>, K extends keyof T>(
  subject: T,
  ...keys: K[]
): [key: string, val: string][] {
  return keys
    .map((key) => [key, subject[key]])
    .filter(([, val]) => val !== undefined)
    .map(([key, val]) => [key.toString(), val.toString()]);
}

function pickFromObject<T extends Record<string, unknown>, K extends keyof T>(
  subject: T,
  ...keys: K[]
): Pick<T, K> {
  const pairs = keys
    .map((key) => [key, subject[key]])
    .filter(([, val]) => val !== undefined)
    .map(([key, val]) => [key, val]);
  return Object.fromEntries(pairs);
}

function withRuntype<T>(validator: rt.Runtype<T>) {
  return (data: unknown) => {
    return validator.check(data);
  };
}

const changeRt = rt
  .Record({
    employeeId: rt.Number,
    timestamp: rt.String,
    changeType: rt.Union(
      rt.Literal('CREATE'),
      rt.Literal('UPDATE'),
      rt.Literal('DELETE'),
      rt.Literal('LOCKED'),
      rt.Literal('REOPENED'),
      rt.Literal('DO_NOT_SHOW'),
    ),
    periodReopened: rt.String,
    periodLocked: rt.String,
  })
  .asPartial();

type Change = rt.Static<typeof changeRt>;

const activityRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      name: rt.String,
      number: rt.String,
      description: rt.String,
      activityType: rt.Union(
        rt.Literal('GENERAL_ACTIVITY'),
        rt.Literal('PROJECT_GENERAL_ACTIVITY'),
        rt.Literal('PROJECT_SPECIFIC_ACTIVITY'),
        rt.Literal('TASK'),
      ),
      isChargeable: rt.Boolean,
      rate: rt.Number,
      costPercentage: rt.Number,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      isProjectActivity: rt.Boolean,
      isGeneral: rt.Boolean,
      isTask: rt.Boolean,
      isDisabled: rt.Boolean,
    })
    .asPartial()
    .asReadonly(),
);

type Activity = rt.Static<typeof activityRt>;

const responseWrapperRt = rt
  .Record({ value: rt.Dictionary(rt.Unknown) })
  .asPartial();

type ResponseWrapper = rt.Static<typeof responseWrapperRt>;

const responseWrapperActivityRt = rt.Record({ value: activityRt }).asPartial();

type ResponseWrapperActivity = rt.Static<typeof responseWrapperActivityRt>;

const listResponseRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(rt.Dictionary(rt.Unknown)),
  })
  .asPartial();

type ListResponse = rt.Static<typeof listResponseRt>;

const listResponseActivityRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(activityRt),
  })
  .asPartial();

type ListResponseActivity = rt.Static<typeof listResponseActivityRt>;

const addonRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      name: rt.String,
      description: rt.String,
      redirectUrl: rt.String,
      status: rt.Union(
        rt.Literal('IN_DEVELOPMENT'),
        rt.Literal('PENDING'),
        rt.Literal('REJECTED'),
        rt.Literal('APPROVED'),
      ),
      wizardStep: rt.Number,
      isPublic: rt.Boolean,
      apiConsumerId: rt.Number,
      visibility: rt.Union(rt.Literal('COMPANY_WIDE'), rt.Literal('PERSONAL')),
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type Addon = rt.Static<typeof addonRt>;

const responseWrapperAddonRt = rt.Record({ value: addonRt }).asPartial();

type ResponseWrapperAddon = rt.Static<typeof responseWrapperAddonRt>;

const listResponseAddonRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(addonRt),
  })
  .asPartial();

type ListResponseAddon = rt.Static<typeof listResponseAddonRt>;

const countryRt = rt.Intersect(
  rt.Record({ id: rt.Number, version: rt.Number }).asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      name: rt.String,
      isoAlpha2Code: rt.String,
      isoAlpha3Code: rt.String,
      isoNumericCode: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

type Country = rt.Static<typeof countryRt>;

const internationalIdRt = rt
  .Record({
    intAmeldingType: rt.Union(
      rt.Literal('PASSPORT_NO'),
      rt.Literal('NATIONAL_INSURANCE_NO'),
      rt.Literal('TAX_IDENTIFICATION_NO'),
      rt.Literal('VALUE_ADDED_TAX_IDENTIFICATION_NO'),
    ),
    country: countryRt,
    number: rt.String,
  })
  .asPartial();

type InternationalId = rt.Static<typeof internationalIdRt>;

type Department = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  name?: string;
  departmentNumber?: string;
  departmentManager?: Employee;
};

const departmentRt: rt.Runtype<Department> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        name: rt.String,
        departmentNumber: rt.String,
        departmentManager: employeeRt,
      })
      .asPartial(),
    rt
      .Record({ changes: rt.Array(changeRt), url: rt.String })
      .asPartial()
      .asReadonly(),
  ),
);

const municipalityRt = rt.Intersect(
  rt.Record({ id: rt.Number, version: rt.Number }).asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      number: rt.String,
      name: rt.String,
      county: rt.String,
      payrollTaxZone: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

type Municipality = rt.Static<typeof municipalityRt>;

const divisionRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      name: rt.String,
      startDate: rt.String,
      endDate: rt.String,
      organizationNumber: rt.String,
      municipalityDate: rt.String,
      municipality: municipalityRt,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type Division = rt.Static<typeof divisionRt>;

const maritimeEmploymentRt = rt
  .Record({
    shipRegister: rt.Union(
      rt.Literal('NIS'),
      rt.Literal('NOR'),
      rt.Literal('FOREIGN'),
    ),
    shipType: rt.Union(
      rt.Literal('OTHER'),
      rt.Literal('DRILLING_PLATFORM'),
      rt.Literal('TOURIST'),
    ),
    tradeArea: rt.Union(rt.Literal('DOMESTIC'), rt.Literal('FOREIGN')),
  })
  .asPartial();

type MaritimeEmployment = rt.Static<typeof maritimeEmploymentRt>;

const occupationCodeRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      nameNO: rt.String,
      code: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type OccupationCode = rt.Static<typeof occupationCodeRt>;

type EmploymentDetails = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  employment?: Employment;
  date?: string;
  employmentType?: 'ORDINARY' | 'MARITIME' | 'FREELANCE';
  employmentForm?: 'PERMANENT' | 'TEMPORARY';
  maritimeEmployment?: MaritimeEmployment;
  remunerationType?:
    | 'MONTHLY_WAGE'
    | 'HOURLY_WAGE'
    | 'COMMISION_PERCENTAGE'
    | 'FEE'
    | 'PIECEWORK_WAGE';
  workingHoursScheme?:
    | 'NOT_SHIFT'
    | 'ROUND_THE_CLOCK'
    | 'SHIFT_365'
    | 'OFFSHORE_336'
    | 'CONTINUOUS'
    | 'OTHER_SHIFT';
  shiftDurationHours?: number;
  occupationCode?: OccupationCode;
  percentageOfFullTimeEquivalent?: number;
  annualSalary?: number;
  hourlyWage?: number;
  payrollTaxMunicipalityId?: Municipality;
};

const employmentDetailsRt: rt.Runtype<EmploymentDetails> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        employment: employmentRt,
        date: rt.String,
        employmentType: rt.Union(
          rt.Literal('ORDINARY'),
          rt.Literal('MARITIME'),
          rt.Literal('FREELANCE'),
        ),
        employmentForm: rt.Union(
          rt.Literal('PERMANENT'),
          rt.Literal('TEMPORARY'),
        ),
        maritimeEmployment: maritimeEmploymentRt,
        remunerationType: rt.Union(
          rt.Literal('MONTHLY_WAGE'),
          rt.Literal('HOURLY_WAGE'),
          rt.Literal('COMMISION_PERCENTAGE'),
          rt.Literal('FEE'),
          rt.Literal('PIECEWORK_WAGE'),
        ),
        workingHoursScheme: rt.Union(
          rt.Literal('NOT_SHIFT'),
          rt.Literal('ROUND_THE_CLOCK'),
          rt.Literal('SHIFT_365'),
          rt.Literal('OFFSHORE_336'),
          rt.Literal('CONTINUOUS'),
          rt.Literal('OTHER_SHIFT'),
        ),
        shiftDurationHours: rt.Number,
        occupationCode: occupationCodeRt,
        percentageOfFullTimeEquivalent: rt.Number,
        annualSalary: rt.Number,
        hourlyWage: rt.Number,
        payrollTaxMunicipalityId: municipalityRt,
      })
      .asPartial(),
    rt
      .Record({ changes: rt.Array(changeRt), url: rt.String })
      .asPartial()
      .asReadonly(),
  ),
);

type Employment = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  employee?: Employee;
  employmentId?: string;
  startDate?: string;
  endDate?: string;
  employmentEndReason?:
    | 'EMPLOYMENT_END_EXPIRED'
    | 'EMPLOYMENT_END_EMPLOYEE'
    | 'EMPLOYMENT_END_EMPLOYER'
    | 'EMPLOYMENT_END_WRONGLY_REPORTED'
    | 'EMPLOYMENT_END_SYSTEM_OR_ACCOUNTANT_CHANGE'
    | 'EMPLOYMENT_END_INTERNAL_CHANGE';
  division?: Division;
  lastSalaryChangeDate?: string;
  noEmploymentRelationship?: boolean;
  isMainEmployer?: boolean;
  taxDeductionCode?:
    | 'loennFraHovedarbeidsgiver'
    | 'loennFraBiarbeidsgiver'
    | 'pensjon'
    | 'loennTilUtenrikstjenestemann'
    | 'loennKunTrygdeavgiftTilUtenlandskBorger'
    | 'loennKunTrygdeavgiftTilUtenlandskBorgerSomGrensegjenger'
    | 'introduksjonsstoenad'
    | 'ufoereytelserFraAndre'
    | 'EMPTY';
  employmentDetails?: EmploymentDetails[];
};

const employmentRt: rt.Runtype<Employment> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        employee: employeeRt,
        employmentId: rt.String,
        startDate: rt.String,
        endDate: rt.String,
        employmentEndReason: rt.Union(
          rt.Literal('EMPLOYMENT_END_EXPIRED'),
          rt.Literal('EMPLOYMENT_END_EMPLOYEE'),
          rt.Literal('EMPLOYMENT_END_EMPLOYER'),
          rt.Literal('EMPLOYMENT_END_WRONGLY_REPORTED'),
          rt.Literal('EMPLOYMENT_END_SYSTEM_OR_ACCOUNTANT_CHANGE'),
          rt.Literal('EMPLOYMENT_END_INTERNAL_CHANGE'),
        ),
        division: divisionRt,
        lastSalaryChangeDate: rt.String,
        noEmploymentRelationship: rt.Boolean,
        isMainEmployer: rt.Boolean,
        taxDeductionCode: rt.Union(
          rt.Literal('loennFraHovedarbeidsgiver'),
          rt.Literal('loennFraBiarbeidsgiver'),
          rt.Literal('pensjon'),
          rt.Literal('loennTilUtenrikstjenestemann'),
          rt.Literal('loennKunTrygdeavgiftTilUtenlandskBorger'),
          rt.Literal('loennKunTrygdeavgiftTilUtenlandskBorgerSomGrensegjenger'),
          rt.Literal('introduksjonsstoenad'),
          rt.Literal('ufoereytelserFraAndre'),
          rt.Literal('EMPTY'),
        ),
        employmentDetails: rt.Array(employmentDetailsRt),
      })
      .asPartial(),
    rt
      .Record({ changes: rt.Array(changeRt), url: rt.String })
      .asPartial()
      .asReadonly(),
  ),
);

const holidayAllowanceEarnedRt = rt
  .Record({
    year: rt.Number,
    amount: rt.Number,
    basis: rt.Number,
    amountExtraHolidayWeek: rt.Number,
  })
  .asPartial();

type HolidayAllowanceEarned = rt.Static<typeof holidayAllowanceEarnedRt>;

const employeeCategoryRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      name: rt.String,
      number: rt.String,
      description: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type EmployeeCategory = rt.Static<typeof employeeCategoryRt>;

type Employee = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  firstName?: string;
  lastName?: string;
  employeeNumber?: string;
  dateOfBirth?: string;
  email?: string;
  phoneNumberMobileCountry?: Country;
  phoneNumberMobile?: string;
  phoneNumberHome?: string;
  phoneNumberWork?: string;
  nationalIdentityNumber?: string;
  dnumber?: string;
  internationalId?: InternationalId;
  bankAccountNumber?: string;
  iban?: string;
  bic?: string;
  creditorBankCountryId?: number;
  usesAbroadPayment?: boolean;
  userType?: 'STANDARD' | 'EXTENDED' | 'NO_ACCESS';
  readonly allowInformationRegistration?: boolean;
  readonly isContact?: boolean;
  comments?: string;
  address?: Address;
  department?: Department;
  employments?: Employment[];
  holidayAllowanceEarned?: HolidayAllowanceEarned;
  employeeCategory?: EmployeeCategory;
};

const employeeRt: rt.Runtype<Employee> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        firstName: rt.String,
        lastName: rt.String,
        employeeNumber: rt.String,
        dateOfBirth: rt.String,
        email: rt.String,
        phoneNumberMobileCountry: countryRt,
        phoneNumberMobile: rt.String,
        phoneNumberHome: rt.String,
        phoneNumberWork: rt.String,
        nationalIdentityNumber: rt.String,
        dnumber: rt.String,
        internationalId: internationalIdRt,
        bankAccountNumber: rt.String,
        iban: rt.String,
        bic: rt.String,
        creditorBankCountryId: rt.Number,
        usesAbroadPayment: rt.Boolean,
        userType: rt.Union(
          rt.Literal('STANDARD'),
          rt.Literal('EXTENDED'),
          rt.Literal('NO_ACCESS'),
        ),
        comments: rt.String,
        address: addressRt,
        department: departmentRt,
        employments: rt.Array(employmentRt),
        holidayAllowanceEarned: holidayAllowanceEarnedRt,
        employeeCategory: employeeCategoryRt,
      })
      .asPartial(),
    rt
      .Record({
        changes: rt.Array(changeRt),
        url: rt.String,
        allowInformationRegistration: rt.Boolean,
        isContact: rt.Boolean,
      })
      .asPartial()
      .asReadonly(),
  ),
);

type Address = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  employee?: Employee;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  city?: string;
  country?: Country;
};

const addressRt: rt.Runtype<Address> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        employee: employeeRt,
        addressLine1: rt.String,
        addressLine2: rt.String,
        postalCode: rt.String,
        city: rt.String,
        country: countryRt,
      })
      .asPartial(),
    rt
      .Record({ changes: rt.Array(changeRt), url: rt.String })
      .asPartial()
      .asReadonly(),
  ),
);

const deliveryAddressRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      employee: employeeRt,
      addressLine1: rt.String,
      addressLine2: rt.String,
      postalCode: rt.String,
      city: rt.String,
      country: countryRt,
      name: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type DeliveryAddress = rt.Static<typeof deliveryAddressRt>;

const responseWrapperDeliveryAddressRt = rt
  .Record({ value: deliveryAddressRt })
  .asPartial();

type ResponseWrapperDeliveryAddress = rt.Static<
  typeof responseWrapperDeliveryAddressRt
>;

const listResponseDeliveryAddressRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(deliveryAddressRt),
  })
  .asPartial();

type ListResponseDeliveryAddress = rt.Static<
  typeof listResponseDeliveryAddressRt
>;

const legacyAddressRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      employee: employeeRt,
      addressLine1: rt.String,
      addressLine2: rt.String,
      postalCode: rt.String,
      city: rt.String,
      country: countryRt,
      name: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type LegacyAddress = rt.Static<typeof legacyAddressRt>;

const responseWrapperLegacyAddressRt = rt
  .Record({ value: legacyAddressRt })
  .asPartial();

type ResponseWrapperLegacyAddress = rt.Static<
  typeof responseWrapperLegacyAddressRt
>;

const listResponseLegacyAddressRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(legacyAddressRt),
  })
  .asPartial();

type ListResponseLegacyAddress = rt.Static<typeof listResponseLegacyAddressRt>;

const responseWrapperIntegerRt = rt.Record({ value: rt.Number }).asPartial();

type ResponseWrapperInteger = rt.Static<typeof responseWrapperIntegerRt>;

const jobDetailDTORt = rt
  .Record({
    name: rt.String,
    group: rt.String,
    description: rt.String,
    jobclass: rt.String,
    jobData: rt.Dictionary(rt.Unknown),
  })
  .asPartial();

type JobDetailDTO = rt.Static<typeof jobDetailDTORt>;

const triggerDTORt = rt
  .Record({
    calendarName: rt.String,
    description: rt.String,
    name: rt.String,
    nextFireTime: rt.String,
    previousFireTime: rt.String,
    state: rt.String,
  })
  .asPartial();

type TriggerDTO = rt.Static<typeof triggerDTORt>;

const jobRt = rt
  .Record({
    name: rt.String,
    group: rt.String,
    stateful: rt.Boolean,
    interruptable: rt.Boolean,
    jobDetail: jobDetailDTORt,
    triggers: rt.Array(triggerDTORt),
  })
  .asPartial();

type Job = rt.Static<typeof jobRt>;

const responseWrapperListJobRt = rt
  .Record({ value: rt.Array(jobRt) })
  .asPartial();

type ResponseWrapperListJob = rt.Static<typeof responseWrapperListJobRt>;

const systemMessageRt = rt.Record({ message: rt.String }).asPartial();

type SystemMessage = rt.Static<typeof systemMessageRt>;

const responseWrapperSystemMessageRt = rt
  .Record({ value: systemMessageRt })
  .asPartial();

type ResponseWrapperSystemMessage = rt.Static<
  typeof responseWrapperSystemMessageRt
>;

const responseWrapperStringRt = rt.Record({ value: rt.String }).asPartial();

type ResponseWrapperString = rt.Static<typeof responseWrapperStringRt>;

type VatType = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  name?: string;
  number?: string;
  percentage?: number;
  deductionPercentage?: number;
  parentType?: VatType;
};

const vatTypeRt: rt.Runtype<VatType> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        name: rt.String,
        number: rt.String,
        percentage: rt.Number,
        deductionPercentage: rt.Number,
        parentType: vatTypeRt,
      })
      .asPartial(),
    rt
      .Record({ changes: rt.Array(changeRt), url: rt.String })
      .asPartial()
      .asReadonly(),
  ),
);

const currencyRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      code: rt.String,
      description: rt.String,
      factor: rt.Number,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type Currency = rt.Static<typeof currencyRt>;

const accountRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      number: rt.Number,
      name: rt.String,
      description: rt.String,
      ledgerType: rt.Union(
        rt.Literal('GENERAL'),
        rt.Literal('CUSTOMER'),
        rt.Literal('VENDOR'),
        rt.Literal('EMPLOYEE'),
        rt.Literal('ASSET'),
      ),
      vatType: vatTypeRt,
      vatLocked: rt.Boolean,
      currency: currencyRt,
      isCloseable: rt.Boolean,
      isApplicableForSupplierInvoice: rt.Boolean,
      requireReconciliation: rt.Boolean,
      isInactive: rt.Boolean,
      isBankAccount: rt.Boolean,
      isInvoiceAccount: rt.Boolean,
      bankAccountNumber: rt.String,
      bankAccountCountry: countryRt,
      bankName: rt.String,
      bankAccountIBAN: rt.String,
      bankAccountSWIFT: rt.String,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      type: rt.Union(
        rt.Literal('ASSETS'),
        rt.Literal('EQUITY'),
        rt.Literal('LIABILITIES'),
        rt.Literal('OPERATING_REVENUES'),
        rt.Literal('OPERATING_EXPENSES'),
        rt.Literal('INVESTMENT_INCOME'),
        rt.Literal('COST_OF_CAPITAL'),
        rt.Literal('TAX_ON_ORDINARY_ACTIVITIES'),
        rt.Literal('EXTRAORDINARY_INCOME'),
        rt.Literal('EXTRAORDINARY_COST'),
        rt.Literal('TAX_ON_EXTRAORDINARY_ACTIVITIES'),
        rt.Literal('ANNUAL_RESULT'),
        rt.Literal('TRANSFERS_AND_ALLOCATIONS'),
      ),
      legalVatTypes: rt.Array(vatTypeRt),
    })
    .asPartial()
    .asReadonly(),
);

type Account = rt.Static<typeof accountRt>;

const assetRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      name: rt.String,
      description: rt.String,
      dateOfAcquisition: rt.String,
      acquisitionCost: rt.Number,
      account: accountRt,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type Asset = rt.Static<typeof assetRt>;

const responseWrapperAssetRt = rt.Record({ value: assetRt }).asPartial();

type ResponseWrapperAsset = rt.Static<typeof responseWrapperAssetRt>;

const listResponseAssetRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(assetRt),
  })
  .asPartial();

type ListResponseAsset = rt.Static<typeof listResponseAssetRt>;

const balanceSheetAccountRt = rt
  .Record({
    account: accountRt,
    balanceIn: rt.Number,
    balanceChange: rt.Number,
    balanceOut: rt.Number,
    startDate: rt.String,
    endDate: rt.String,
  })
  .asPartial()
  .asReadonly();

type BalanceSheetAccount = rt.Static<typeof balanceSheetAccountRt>;

const listResponseBalanceSheetAccountRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(balanceSheetAccountRt),
  })
  .asPartial();

type ListResponseBalanceSheetAccount = rt.Static<
  typeof listResponseBalanceSheetAccountRt
>;

const bankRt = rt.Intersect(
  rt.Record({ id: rt.Number, version: rt.Number }).asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      name: rt.String,
      bankStatementFileFormatSupport: rt.Array(
        rt.Union(
          rt.Literal('DNB_CSV'),
          rt.Literal('EIKA_TELEPAY'),
          rt.Literal('SPAREBANK1_TELEPAY'),
          rt.Literal('VISMA_ACCOUNT_STATEMENT'),
          rt.Literal('HANDELSBANKEN_TELEPAY'),
          rt.Literal('SPAREBANKEN_VEST_TELEPAY'),
          rt.Literal('NORDEA_CSV'),
          rt.Literal('TRANSFERWISE'),
          rt.Literal('SPAREBANKEN_SOR_TELEPAY'),
          rt.Literal('SPAREBANKEN_OST_TELEPAY'),
          rt.Literal('DANSKE_BANK_CSV'),
          rt.Literal('CULTURA_BANK_TELEPAY'),
          rt.Literal('SBANKEN_PRIVAT_CSV'),
          rt.Literal('HAUGESUND_SPAREBANK_CSV'),
        ),
      ),
      registerNumbers: rt.Array(rt.Number),
    })
    .asPartial()
    .asReadonly(),
);

type Bank = rt.Static<typeof bankRt>;

const responseWrapperBankRt = rt.Record({ value: bankRt }).asPartial();

type ResponseWrapperBank = rt.Static<typeof responseWrapperBankRt>;

const listResponseBankRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(bankRt),
  })
  .asPartial();

type ListResponseBank = rt.Static<typeof listResponseBankRt>;

const bankAgreementRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      iban: rt.String,
      bban: rt.String,
      account: accountRt,
      dateCreated: rt.String,
      bank: bankRt,
      showAdviceCurrencyMismatch: rt.Boolean,
      accountInBankId: rt.String,
      division: rt.String,
      ccmAgreementId: rt.String,
      organisationNumber: rt.String,
      approveInOnlineBanking: rt.Boolean,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      description: rt.String,
      uploaderEmployee: employeeRt,
      country: countryRt,
      currency: currencyRt,
      isActive: rt.Boolean,
    })
    .asPartial()
    .asReadonly(),
);

type BankAgreement = rt.Static<typeof bankAgreementRt>;

const listResponseBankAgreementRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(bankAgreementRt),
  })
  .asPartial();

type ListResponseBankAgreement = rt.Static<typeof listResponseBankAgreementRt>;

const bankAgreementCreationDTORt = rt
  .Record({
    bankId: rt.Number,
    accountInBankId: rt.String,
    ccmAgreementId: rt.String,
    division: rt.String,
    organizationNumber: rt.String,
    electronicCreation: rt.Boolean,
    approveInOnlineBanking: rt.Boolean,
    bankAccounts: rt.Array(accountRt),
  })
  .asPartial();

type BankAgreementCreationDTO = rt.Static<typeof bankAgreementCreationDTORt>;

const responseWrapperListStringRt = rt
  .Record({ value: rt.Array(rt.String) })
  .asPartial();

type ResponseWrapperListString = rt.Static<typeof responseWrapperListStringRt>;

const responseWrapperListIntegerRt = rt
  .Record({ value: rt.Array(rt.Number) })
  .asPartial();

type ResponseWrapperListInteger = rt.Static<
  typeof responseWrapperListIntegerRt
>;

const electronicSupportDTORt = rt
  .Record({
    bankId: rt.Number,
    bankName: rt.String,
    type: rt.Union(rt.Literal('PARTIAL'), rt.Literal('COMPLETE')),
    bankUrl: rt.String,
  })
  .asPartial();

type ElectronicSupportDTO = rt.Static<typeof electronicSupportDTORt>;

const responseWrapperListElectronicSupportDTORt = rt
  .Record({ value: rt.Array(electronicSupportDTORt) })
  .asPartial();

type ResponseWrapperListElectronicSupportDTO = rt.Static<
  typeof responseWrapperListElectronicSupportDTORt
>;

const responseWrapperBankAgreementRt = rt
  .Record({ value: bankAgreementRt })
  .asPartial();

type ResponseWrapperBankAgreement = rt.Static<
  typeof responseWrapperBankAgreementRt
>;

const responseWrapperBrregStatusCodeRt = rt
  .Record({
    value: rt.Union(
      rt.Literal('DENIED'),
      rt.Literal('MANUAL_CHECK'),
      rt.Literal('ACCEPTED'),
    ),
  })
  .asPartial();

type ResponseWrapperBrregStatusCode = rt.Static<
  typeof responseWrapperBrregStatusCodeRt
>;

const responseWrapperElectronicSupportDTORt = rt
  .Record({ value: electronicSupportDTORt })
  .asPartial();

type ResponseWrapperElectronicSupportDTO = rt.Static<
  typeof responseWrapperElectronicSupportDTORt
>;

const bankOnboardingAccessRequestDTORt = rt
  .Record({
    id: rt.Number,
    requesteeEmployeeId: rt.Number,
    requesteeName: rt.String,
    roleId: rt.Number,
  })
  .asPartial();

type BankOnboardingAccessRequestDTO = rt.Static<
  typeof bankOnboardingAccessRequestDTORt
>;

const bankOnboardingStepDTORt = rt
  .Record({
    id: rt.Number,
    state: rt.Union(
      rt.Literal('INCOMPLETE'),
      rt.Literal('COMPLETED'),
      rt.Literal('PROCESSING'),
    ),
    accessible: rt.Boolean,
  })
  .asPartial();

type BankOnboardingStepDTO = rt.Static<typeof bankOnboardingStepDTORt>;

const bankOnboardingDTORt = rt
  .Record({
    steps: rt.Array(bankOnboardingStepDTORt),
    accessRequest: bankOnboardingAccessRequestDTORt,
    hasFullAccess: rt.Boolean,
    companyOrgnr: rt.String,
    lockedCurrenciesMap: rt.Dictionary(rt.Unknown),
    userIsAutoPayProvisioned: rt.Boolean,
  })
  .asPartial();

type BankOnboardingDTO = rt.Static<typeof bankOnboardingDTORt>;

const responseWrapperBankOnboardingDTORt = rt
  .Record({ value: bankOnboardingDTORt })
  .asPartial();

type ResponseWrapperBankOnboardingDTO = rt.Static<
  typeof responseWrapperBankOnboardingDTORt
>;

const customerCategoryRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      name: rt.String,
      number: rt.String,
      description: rt.String,
      type: rt.Number,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type CustomerCategory = rt.Static<typeof customerCategoryRt>;

const companyBankAccountPresentationRt = rt.Intersect(
  rt.Record({ iban: rt.String, bban: rt.String, bic: rt.String }).asPartial(),
  rt
    .Record({
      country: countryRt,
      provider: rt.Union(rt.Literal('NETS'), rt.Literal('AUTOPAY')),
    })
    .asPartial()
    .asReadonly(),
);

type CompanyBankAccountPresentation = rt.Static<
  typeof companyBankAccountPresentationRt
>;

const customerRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      name: rt.String,
      organizationNumber: rt.String,
      supplierNumber: rt.Number,
      customerNumber: rt.Number,
      isSupplier: rt.Boolean,
      accountManager: employeeRt,
      email: rt.String,
      invoiceEmail: rt.String,
      overdueNoticeEmail: rt.String,
      bankAccounts: rt.Array(rt.String),
      phoneNumber: rt.String,
      phoneNumberMobile: rt.String,
      description: rt.String,
      language: rt.Union(rt.Literal('NO'), rt.Literal('EN'), rt.Literal('SV')),
      isPrivateIndividual: rt.Boolean,
      singleCustomerInvoice: rt.Boolean,
      invoiceSendMethod: rt.Union(
        rt.Literal('EMAIL'),
        rt.Literal('EHF'),
        rt.Literal('EFAKTURA'),
        rt.Literal('VIPPS'),
        rt.Literal('PAPER'),
        rt.Literal('MANUAL'),
      ),
      emailAttachmentType: rt.Union(
        rt.Literal('LINK'),
        rt.Literal('ATTACHMENT'),
      ),
      postalAddress: addressRt,
      physicalAddress: addressRt,
      deliveryAddress: deliveryAddressRt,
      category1: customerCategoryRt,
      category2: customerCategoryRt,
      category3: customerCategoryRt,
      invoicesDueIn: rt.Number,
      invoicesDueInType: rt.Union(
        rt.Literal('DAYS'),
        rt.Literal('MONTHS'),
        rt.Literal('RECURRING_DAY_OF_MONTH'),
      ),
      currency: currencyRt,
      bankAccountPresentation: rt.Array(companyBankAccountPresentationRt),
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      isCustomer: rt.Boolean,
      isInactive: rt.Boolean,
    })
    .asPartial()
    .asReadonly(),
);

type Customer = rt.Static<typeof customerRt>;

const projectCategoryRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      name: rt.String,
      number: rt.String,
      description: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type ProjectCategory = rt.Static<typeof projectCategoryRt>;

const productUnitRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      name: rt.String,
      nameShort: rt.String,
      commonCode: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type ProductUnit = rt.Static<typeof productUnitRt>;

const supplierRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      name: rt.String,
      organizationNumber: rt.String,
      supplierNumber: rt.Number,
      customerNumber: rt.Number,
      isCustomer: rt.Boolean,
      email: rt.String,
      bankAccounts: rt.Array(rt.String),
      invoiceEmail: rt.String,
      overdueNoticeEmail: rt.String,
      phoneNumber: rt.String,
      phoneNumberMobile: rt.String,
      description: rt.String,
      isPrivateIndividual: rt.Boolean,
      showProducts: rt.Boolean,
      postalAddress: addressRt,
      physicalAddress: addressRt,
      deliveryAddress: deliveryAddressRt,
      category1: customerCategoryRt,
      category2: customerCategoryRt,
      category3: customerCategoryRt,
      bankAccountPresentation: rt.Array(companyBankAccountPresentationRt),
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      isSupplier: rt.Boolean,
      isInactive: rt.Boolean,
      accountManager: employeeRt,
    })
    .asPartial()
    .asReadonly(),
);

type Supplier = rt.Static<typeof supplierRt>;

type Product = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  name?: string;
  number?: string;
  description?: string;
  ean?: string;
  readonly elNumber?: string;
  readonly nrfNumber?: string;
  costExcludingVatCurrency?: number;
  expenses?: number;
  readonly expensesInPercent?: number;
  readonly costPrice?: number;
  readonly profit?: number;
  readonly profitInPercent?: number;
  priceExcludingVatCurrency?: number;
  priceIncludingVatCurrency?: number;
  isInactive?: boolean;
  productUnit?: ProductUnit;
  isStockItem?: boolean;
  readonly stockOfGoods?: number;
  vatType?: VatType;
  currency?: Currency;
  department?: Department;
  account?: Account;
  readonly discountPrice?: number;
  supplier?: Supplier;
  resaleProduct?: Product;
};

const productRt: rt.Runtype<Product> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        name: rt.String,
        number: rt.String,
        description: rt.String,
        ean: rt.String,
        costExcludingVatCurrency: rt.Number,
        expenses: rt.Number,
        priceExcludingVatCurrency: rt.Number,
        priceIncludingVatCurrency: rt.Number,
        isInactive: rt.Boolean,
        productUnit: productUnitRt,
        isStockItem: rt.Boolean,
        vatType: vatTypeRt,
        currency: currencyRt,
        department: departmentRt,
        account: accountRt,
        supplier: supplierRt,
        resaleProduct: productRt,
      })
      .asPartial(),
    rt
      .Record({
        changes: rt.Array(changeRt),
        url: rt.String,
        elNumber: rt.String,
        nrfNumber: rt.String,
        expensesInPercent: rt.Number,
        costPrice: rt.Number,
        profit: rt.Number,
        profitInPercent: rt.Number,
        stockOfGoods: rt.Number,
        discountPrice: rt.Number,
      })
      .asPartial()
      .asReadonly(),
  ),
);

const inventoryRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      name: rt.String,
      number: rt.String,
      isMainInventory: rt.Boolean,
      isInactive: rt.Boolean,
      description: rt.String,
      email: rt.String,
      phone: rt.String,
      deletable: rt.Boolean,
      address: addressRt,
      lastStocking: rt.String,
      status: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type Inventory = rt.Static<typeof inventoryRt>;

const inventoryLocationRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      inventory: inventoryRt,
      name: rt.String,
      isInactive: rt.Boolean,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String, number: rt.Number })
    .asPartial()
    .asReadonly(),
);

type InventoryLocation = rt.Static<typeof inventoryLocationRt>;

const contactRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      firstName: rt.String,
      lastName: rt.String,
      email: rt.String,
      phoneNumberMobileCountry: countryRt,
      phoneNumberMobile: rt.String,
      phoneNumberWork: rt.String,
      customer: customerRt,
      department: departmentRt,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type Contact = rt.Static<typeof contactRt>;

type OrderGroup = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  order?: Order;
  title?: string;
  comment?: string;
  sortIndex?: number;
};

const orderGroupRt: rt.Runtype<OrderGroup> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        order: orderRt,
        title: rt.String,
        comment: rt.String,
        sortIndex: rt.Number,
      })
      .asPartial(),
    rt
      .Record({ changes: rt.Array(changeRt), url: rt.String })
      .asPartial()
      .asReadonly(),
  ),
);

type OrderLine = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  product?: Product;
  inventory?: Inventory;
  inventoryLocation?: InventoryLocation;
  description?: string;
  count?: number;
  unitCostCurrency?: number;
  unitPriceExcludingVatCurrency?: number;
  readonly currency?: Currency;
  markup?: number;
  discount?: number;
  vatType?: VatType;
  readonly amountExcludingVatCurrency?: number;
  readonly amountIncludingVatCurrency?: number;
  order?: Order;
  unitPriceIncludingVatCurrency?: number;
  isSubscription?: boolean;
  subscriptionPeriodStart?: string;
  subscriptionPeriodEnd?: string;
  orderGroup?: OrderGroup;
};

const orderLineRt: rt.Runtype<OrderLine> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        product: productRt,
        inventory: inventoryRt,
        inventoryLocation: inventoryLocationRt,
        description: rt.String,
        count: rt.Number,
        unitCostCurrency: rt.Number,
        unitPriceExcludingVatCurrency: rt.Number,
        markup: rt.Number,
        discount: rt.Number,
        vatType: vatTypeRt,
        order: orderRt,
        unitPriceIncludingVatCurrency: rt.Number,
        isSubscription: rt.Boolean,
        subscriptionPeriodStart: rt.String,
        subscriptionPeriodEnd: rt.String,
        orderGroup: orderGroupRt,
      })
      .asPartial(),
    rt
      .Record({
        changes: rt.Array(changeRt),
        url: rt.String,
        currency: currencyRt,
        amountExcludingVatCurrency: rt.Number,
        amountIncludingVatCurrency: rt.Number,
      })
      .asPartial()
      .asReadonly(),
  ),
);

const documentRt = rt.Intersect(
  rt
    .Record({ id: rt.Number, version: rt.Number, fileName: rt.String })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      size: rt.Number,
      mimeType: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

type Document = rt.Static<typeof documentRt>;

type Order = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  customer?: Customer;
  contact?: Contact;
  attn?: Contact;
  receiverEmail?: string;
  overdueNoticeEmail?: string;
  number?: string;
  reference?: string;
  ourContact?: Contact;
  ourContactEmployee?: Employee;
  department?: Department;
  orderDate?: string;
  project?: Project;
  invoiceComment?: string;
  currency?: Currency;
  invoicesDueIn?: number;
  invoicesDueInType?: 'DAYS' | 'MONTHS' | 'RECURRING_DAY_OF_MONTH';
  isShowOpenPostsOnInvoices?: boolean;
  isClosed?: boolean;
  deliveryDate?: string;
  deliveryAddress?: DeliveryAddress;
  deliveryComment?: string;
  isPrioritizeAmountsIncludingVat?: boolean;
  orderLineSorting?: 'ID' | 'PRODUCT' | 'CUSTOM';
  orderLines?: OrderLine[];
  isSubscription?: boolean;
  subscriptionDuration?: number;
  subscriptionDurationType?: 'MONTHS' | 'YEAR';
  subscriptionPeriodsOnInvoice?: number;
  readonly subscriptionPeriodsOnInvoiceType?: 'MONTHS';
  subscriptionInvoicingTimeInAdvanceOrArrears?: 'ADVANCE' | 'ARREARS';
  subscriptionInvoicingTime?: number;
  subscriptionInvoicingTimeType?: 'DAYS' | 'MONTHS';
  isSubscriptionAutoInvoicing?: boolean;
  readonly preliminaryInvoice?: Invoice;
  readonly attachment?: Document[];
};

const orderRt: rt.Runtype<Order> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        customer: customerRt,
        contact: contactRt,
        attn: contactRt,
        receiverEmail: rt.String,
        overdueNoticeEmail: rt.String,
        number: rt.String,
        reference: rt.String,
        ourContact: contactRt,
        ourContactEmployee: employeeRt,
        department: departmentRt,
        orderDate: rt.String,
        project: projectRt,
        invoiceComment: rt.String,
        currency: currencyRt,
        invoicesDueIn: rt.Number,
        invoicesDueInType: rt.Union(
          rt.Literal('DAYS'),
          rt.Literal('MONTHS'),
          rt.Literal('RECURRING_DAY_OF_MONTH'),
        ),
        isShowOpenPostsOnInvoices: rt.Boolean,
        isClosed: rt.Boolean,
        deliveryDate: rt.String,
        deliveryAddress: deliveryAddressRt,
        deliveryComment: rt.String,
        isPrioritizeAmountsIncludingVat: rt.Boolean,
        orderLineSorting: rt.Union(
          rt.Literal('ID'),
          rt.Literal('PRODUCT'),
          rt.Literal('CUSTOM'),
        ),
        orderLines: rt.Array(orderLineRt),
        isSubscription: rt.Boolean,
        subscriptionDuration: rt.Number,
        subscriptionDurationType: rt.Union(
          rt.Literal('MONTHS'),
          rt.Literal('YEAR'),
        ),
        subscriptionPeriodsOnInvoice: rt.Number,
        subscriptionInvoicingTimeInAdvanceOrArrears: rt.Union(
          rt.Literal('ADVANCE'),
          rt.Literal('ARREARS'),
        ),
        subscriptionInvoicingTime: rt.Number,
        subscriptionInvoicingTimeType: rt.Union(
          rt.Literal('DAYS'),
          rt.Literal('MONTHS'),
        ),
        isSubscriptionAutoInvoicing: rt.Boolean,
      })
      .asPartial(),
    rt
      .Record({
        changes: rt.Array(changeRt),
        url: rt.String,
        subscriptionPeriodsOnInvoiceType: rt.Union(rt.Literal('MONTHS')),
        preliminaryInvoice: invoiceRt,
        attachment: rt.Array(documentRt),
      })
      .asPartial()
      .asReadonly(),
  ),
);

type ProjectInvoiceDetails = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  readonly project?: Project;
  readonly feeAmount?: number;
  readonly feeAmountCurrency?: number;
  readonly markupPercent?: number;
  readonly markupAmount?: number;
  readonly markupAmountCurrency?: number;
  readonly amountOrderLinesAndReinvoicing?: number;
  readonly amountOrderLinesAndReinvoicingCurrency?: number;
  readonly amountTravelReportsAndExpenses?: number;
  readonly amountTravelReportsAndExpensesCurrency?: number;
  readonly feeInvoiceText?: string;
  readonly invoiceText?: string;
  readonly includeOrderLinesAndReinvoicing?: boolean;
  readonly includeHours?: boolean;
  readonly includeOnAccountBalance?: boolean;
  readonly onAccountBalanceAmount?: number;
  readonly onAccountBalanceAmountCurrency?: number;
  readonly vatType?: VatType;
  readonly invoice?: Invoice;
};

const projectInvoiceDetailsRt: rt.Runtype<ProjectInvoiceDetails> = rt.Lazy(() =>
  rt.Intersect(
    rt.Record({ id: rt.Number, version: rt.Number }).asPartial(),
    rt
      .Record({
        changes: rt.Array(changeRt),
        url: rt.String,
        project: projectRt,
        feeAmount: rt.Number,
        feeAmountCurrency: rt.Number,
        markupPercent: rt.Number,
        markupAmount: rt.Number,
        markupAmountCurrency: rt.Number,
        amountOrderLinesAndReinvoicing: rt.Number,
        amountOrderLinesAndReinvoicingCurrency: rt.Number,
        amountTravelReportsAndExpenses: rt.Number,
        amountTravelReportsAndExpensesCurrency: rt.Number,
        feeInvoiceText: rt.String,
        invoiceText: rt.String,
        includeOrderLinesAndReinvoicing: rt.Boolean,
        includeHours: rt.Boolean,
        includeOnAccountBalance: rt.Boolean,
        onAccountBalanceAmount: rt.Number,
        onAccountBalanceAmountCurrency: rt.Number,
        vatType: vatTypeRt,
        invoice: invoiceRt,
      })
      .asPartial()
      .asReadonly(),
  ),
);

const voucherTypeRt = rt.Intersect(
  rt.Record({ id: rt.Number, version: rt.Number, name: rt.String }).asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type VoucherType = rt.Static<typeof voucherTypeRt>;

type CloseGroup = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  date?: string;
  readonly postings?: Posting[];
};

const closeGroupRt: rt.Runtype<CloseGroup> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({ id: rt.Number, version: rt.Number, date: rt.String })
      .asPartial(),
    rt
      .Record({
        changes: rt.Array(changeRt),
        url: rt.String,
        postings: rt.Array(postingRt),
      })
      .asPartial()
      .asReadonly(),
  ),
);

type Posting = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  readonly voucher?: Voucher;
  date?: string;
  description?: string;
  account?: Account;
  customer?: Customer;
  supplier?: Supplier;
  employee?: Employee;
  project?: Project;
  product?: Product;
  department?: Department;
  vatType?: VatType;
  amount?: number;
  amountCurrency?: number;
  amountGross?: number;
  amountGrossCurrency?: number;
  currency?: Currency;
  closeGroup?: CloseGroup;
  invoiceNumber?: string;
  termOfPayment?: string;
  row?: number;
  readonly type?:
    | 'INCOMING_PAYMENT'
    | 'INCOMING_PAYMENT_OPPOSITE'
    | 'INVOICE_EXPENSE'
    | 'OUTGOING_INVOICE_CUSTOMER_POSTING';
  readonly systemGenerated?: boolean;
};

const postingRt: rt.Runtype<Posting> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        date: rt.String,
        description: rt.String,
        account: accountRt,
        customer: customerRt,
        supplier: supplierRt,
        employee: employeeRt,
        project: projectRt,
        product: productRt,
        department: departmentRt,
        vatType: vatTypeRt,
        amount: rt.Number,
        amountCurrency: rt.Number,
        amountGross: rt.Number,
        amountGrossCurrency: rt.Number,
        currency: currencyRt,
        closeGroup: closeGroupRt,
        invoiceNumber: rt.String,
        termOfPayment: rt.String,
        row: rt.Number,
      })
      .asPartial(),
    rt
      .Record({
        changes: rt.Array(changeRt),
        url: rt.String,
        voucher: voucherRt,
        type: rt.Union(
          rt.Literal('INCOMING_PAYMENT'),
          rt.Literal('INCOMING_PAYMENT_OPPOSITE'),
          rt.Literal('INVOICE_EXPENSE'),
          rt.Literal('OUTGOING_INVOICE_CUSTOMER_POSTING'),
        ),
        systemGenerated: rt.Boolean,
      })
      .asPartial()
      .asReadonly(),
  ),
);

type Voucher = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  date?: string;
  readonly number?: number;
  readonly tempNumber?: number;
  readonly year?: number;
  description?: string;
  voucherType?: VoucherType;
  readonly reverseVoucher?: Voucher;
  postings?: Posting[];
  readonly document?: Document;
  readonly attachment?: Document;
  readonly ediDocument?: Document;
};

const voucherRt: rt.Runtype<Voucher> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        date: rt.String,
        description: rt.String,
        voucherType: voucherTypeRt,
        postings: rt.Array(postingRt),
      })
      .asPartial(),
    rt
      .Record({
        changes: rt.Array(changeRt),
        url: rt.String,
        number: rt.Number,
        tempNumber: rt.Number,
        year: rt.Number,
        reverseVoucher: voucherRt,
        document: documentRt,
        attachment: documentRt,
        ediDocument: documentRt,
      })
      .asPartial()
      .asReadonly(),
  ),
);

const reminderRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      termOfPayment: rt.String,
      type: rt.Union(
        rt.Literal('SOFT_REMINDER'),
        rt.Literal('REMINDER'),
        rt.Literal('NOTICE_OF_DEBT_COLLECTION'),
        rt.Literal('DEBT_COLLECTION'),
      ),
      comment: rt.String,
      kid: rt.String,
      bankAccountNumber: rt.String,
      bankAccountIBAN: rt.String,
      bankAccountSWIFT: rt.String,
      bank: rt.String,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      reminderDate: rt.String,
      charge: rt.Number,
      chargeCurrency: rt.Number,
      totalCharge: rt.Number,
      totalChargeCurrency: rt.Number,
      totalAmountCurrency: rt.Number,
      interests: rt.Number,
      interestRate: rt.Number,
      currency: currencyRt,
    })
    .asPartial()
    .asReadonly(),
);

type Reminder = rt.Static<typeof reminderRt>;

type Invoice = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  invoiceNumber?: number;
  invoiceDate?: string;
  readonly customer?: Customer;
  readonly creditedInvoice?: number;
  readonly isCredited?: boolean;
  invoiceDueDate?: string;
  kid?: string;
  readonly invoiceComment?: string;
  comment?: string;
  orders?: Order[];
  readonly orderLines?: OrderLine[];
  readonly travelReports?: TravelExpense[];
  readonly projectInvoiceDetails?: ProjectInvoiceDetails[];
  readonly voucher?: Voucher;
  readonly deliveryDate?: string;
  readonly amount?: number;
  readonly amountCurrency?: number;
  readonly amountExcludingVat?: number;
  readonly amountExcludingVatCurrency?: number;
  readonly amountRoundoff?: number;
  readonly amountRoundoffCurrency?: number;
  readonly amountOutstanding?: number;
  readonly amountCurrencyOutstanding?: number;
  readonly amountOutstandingTotal?: number;
  readonly amountCurrencyOutstandingTotal?: number;
  readonly sumRemits?: number;
  readonly currency?: Currency;
  readonly isCreditNote?: boolean;
  readonly isCharged?: boolean;
  readonly isApproved?: boolean;
  readonly postings?: Posting[];
  readonly reminders?: Reminder[];
  invoiceRemarks?: string;
  paymentTypeId?: number;
  paidAmount?: number;
  ehfSendStatus?:
    | 'DO_NOT_SEND'
    | 'SEND'
    | 'SENT'
    | 'SEND_FAILURE_RECIPIENT_NOT_FOUND';
};

const invoiceRt: rt.Runtype<Invoice> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        invoiceNumber: rt.Number,
        invoiceDate: rt.String,
        invoiceDueDate: rt.String,
        kid: rt.String,
        comment: rt.String,
        orders: rt.Array(orderRt),
        invoiceRemarks: rt.String,
        paymentTypeId: rt.Number,
        paidAmount: rt.Number,
        ehfSendStatus: rt.Union(
          rt.Literal('DO_NOT_SEND'),
          rt.Literal('SEND'),
          rt.Literal('SENT'),
          rt.Literal('SEND_FAILURE_RECIPIENT_NOT_FOUND'),
        ),
      })
      .asPartial(),
    rt
      .Record({
        changes: rt.Array(changeRt),
        url: rt.String,
        customer: customerRt,
        creditedInvoice: rt.Number,
        isCredited: rt.Boolean,
        invoiceComment: rt.String,
        orderLines: rt.Array(orderLineRt),
        travelReports: rt.Array(travelExpenseRt),
        projectInvoiceDetails: rt.Array(projectInvoiceDetailsRt),
        voucher: voucherRt,
        deliveryDate: rt.String,
        amount: rt.Number,
        amountCurrency: rt.Number,
        amountExcludingVat: rt.Number,
        amountExcludingVatCurrency: rt.Number,
        amountRoundoff: rt.Number,
        amountRoundoffCurrency: rt.Number,
        amountOutstanding: rt.Number,
        amountCurrencyOutstanding: rt.Number,
        amountOutstandingTotal: rt.Number,
        amountCurrencyOutstandingTotal: rt.Number,
        sumRemits: rt.Number,
        currency: currencyRt,
        isCreditNote: rt.Boolean,
        isCharged: rt.Boolean,
        isApproved: rt.Boolean,
        postings: rt.Array(postingRt),
        reminders: rt.Array(reminderRt),
      })
      .asPartial()
      .asReadonly(),
  ),
);

type ProjectOrderLine = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  product?: Product;
  inventory?: Inventory;
  inventoryLocation?: InventoryLocation;
  description?: string;
  count?: number;
  unitCostCurrency?: number;
  unitPriceExcludingVatCurrency?: number;
  readonly currency?: Currency;
  markup?: number;
  discount?: number;
  vatType?: VatType;
  readonly amountExcludingVatCurrency?: number;
  readonly amountIncludingVatCurrency?: number;
  project?: Project;
  date?: string;
  isChargeable?: boolean;
  readonly isBudget?: boolean;
  readonly invoice?: Invoice;
};

const projectOrderLineRt: rt.Runtype<ProjectOrderLine> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        product: productRt,
        inventory: inventoryRt,
        inventoryLocation: inventoryLocationRt,
        description: rt.String,
        count: rt.Number,
        unitCostCurrency: rt.Number,
        unitPriceExcludingVatCurrency: rt.Number,
        markup: rt.Number,
        discount: rt.Number,
        vatType: vatTypeRt,
        project: projectRt,
        date: rt.String,
        isChargeable: rt.Boolean,
      })
      .asPartial(),
    rt
      .Record({
        changes: rt.Array(changeRt),
        url: rt.String,
        currency: currencyRt,
        amountExcludingVatCurrency: rt.Number,
        amountIncludingVatCurrency: rt.Number,
        isBudget: rt.Boolean,
        invoice: invoiceRt,
      })
      .asPartial()
      .asReadonly(),
  ),
);

type ProjectSpecificRate = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  hourlyRate?: number;
  hourlyCostPercentage?: number;
  projectHourlyRate?: ProjectHourlyRate;
  employee?: Employee;
  activity?: Activity;
};

const projectSpecificRateRt: rt.Runtype<ProjectSpecificRate> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        hourlyRate: rt.Number,
        hourlyCostPercentage: rt.Number,
        projectHourlyRate: projectHourlyRateRt,
        employee: employeeRt,
        activity: activityRt,
      })
      .asPartial(),
    rt
      .Record({ changes: rt.Array(changeRt), url: rt.String })
      .asPartial()
      .asReadonly(),
  ),
);

type ProjectHourlyRate = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  project?: Project;
  startDate?: string;
  showInProjectOrder?: boolean;
  hourlyRateModel?:
    | 'TYPE_PREDEFINED_HOURLY_RATES'
    | 'TYPE_PROJECT_SPECIFIC_HOURLY_RATES'
    | 'TYPE_FIXED_HOURLY_RATE';
  projectSpecificRates?: ProjectSpecificRate[];
  fixedRate?: number;
};

const projectHourlyRateRt: rt.Runtype<ProjectHourlyRate> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        project: projectRt,
        startDate: rt.String,
        showInProjectOrder: rt.Boolean,
        hourlyRateModel: rt.Union(
          rt.Literal('TYPE_PREDEFINED_HOURLY_RATES'),
          rt.Literal('TYPE_PROJECT_SPECIFIC_HOURLY_RATES'),
          rt.Literal('TYPE_FIXED_HOURLY_RATE'),
        ),
        projectSpecificRates: rt.Array(projectSpecificRateRt),
        fixedRate: rt.Number,
      })
      .asPartial(),
    rt
      .Record({ changes: rt.Array(changeRt), url: rt.String })
      .asPartial()
      .asReadonly(),
  ),
);

type ProjectParticipant = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  project?: Project;
  employee?: Employee;
  adminAccess?: boolean;
};

const projectParticipantRt: rt.Runtype<ProjectParticipant> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        project: projectRt,
        employee: employeeRt,
        adminAccess: rt.Boolean,
      })
      .asPartial(),
    rt
      .Record({ changes: rt.Array(changeRt), url: rt.String })
      .asPartial()
      .asReadonly(),
  ),
);

type ProjectActivity = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  activity?: Activity;
  project?: Project;
  startDate?: string;
  endDate?: string;
  isClosed?: boolean;
  budgetHours?: number;
  budgetHourlyRateCurrency?: number;
  budgetFeeCurrency?: number;
};

const projectActivityRt: rt.Runtype<ProjectActivity> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        activity: activityRt,
        project: projectRt,
        startDate: rt.String,
        endDate: rt.String,
        isClosed: rt.Boolean,
        budgetHours: rt.Number,
        budgetHourlyRateCurrency: rt.Number,
        budgetFeeCurrency: rt.Number,
      })
      .asPartial(),
    rt
      .Record({ changes: rt.Array(changeRt), url: rt.String })
      .asPartial()
      .asReadonly(),
  ),
);

type Project = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  name?: string;
  number?: string;
  readonly displayName?: string;
  description?: string;
  projectManager?: Employee;
  department?: Department;
  mainProject?: Project;
  startDate?: string;
  endDate?: string;
  customer?: Customer;
  isClosed?: boolean;
  isReadyForInvoicing?: boolean;
  isInternal?: boolean;
  readonly isOffer?: boolean;
  isFixedPrice?: boolean;
  projectCategory?: ProjectCategory;
  deliveryAddress?: DeliveryAddress;
  displayNameFormat?:
    | 'NAME_STANDARD'
    | 'NAME_INCL_CUSTOMER_NAME'
    | 'NAME_INCL_PARENT_NAME'
    | 'NAME_INCL_PARENT_NUMBER'
    | 'NAME_INCL_PARENT_NAME_AND_NUMBER';
  reference?: string;
  externalAccountsNumber?: string;
  readonly discountPercentage?: number;
  vatType?: VatType;
  fixedprice?: number;
  readonly contributionMarginPercent?: number;
  readonly numberOfSubProjects?: number;
  readonly numberOfProjectParticipants?: number;
  readonly orderLines?: ProjectOrderLine[];
  currency?: Currency;
  markUpOrderLines?: number;
  markUpFeesEarned?: number;
  isPriceCeiling?: boolean;
  priceCeilingAmount?: number;
  projectHourlyRates?: ProjectHourlyRate[];
  forParticipantsOnly?: boolean;
  participants?: ProjectParticipant[];
  contact?: Contact;
  attention?: Contact;
  invoiceComment?: string;
  readonly invoicingPlan?: Invoice[];
  readonly preliminaryInvoice?: Invoice;
  generalProjectActivitiesPerProjectOnly?: boolean;
  projectActivities?: ProjectActivity[];
  readonly hierarchyNameAndNumber?: string;
};

const projectRt: rt.Runtype<Project> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        name: rt.String,
        number: rt.String,
        description: rt.String,
        projectManager: employeeRt,
        department: departmentRt,
        mainProject: projectRt,
        startDate: rt.String,
        endDate: rt.String,
        customer: customerRt,
        isClosed: rt.Boolean,
        isReadyForInvoicing: rt.Boolean,
        isInternal: rt.Boolean,
        isFixedPrice: rt.Boolean,
        projectCategory: projectCategoryRt,
        deliveryAddress: deliveryAddressRt,
        displayNameFormat: rt.Union(
          rt.Literal('NAME_STANDARD'),
          rt.Literal('NAME_INCL_CUSTOMER_NAME'),
          rt.Literal('NAME_INCL_PARENT_NAME'),
          rt.Literal('NAME_INCL_PARENT_NUMBER'),
          rt.Literal('NAME_INCL_PARENT_NAME_AND_NUMBER'),
        ),
        reference: rt.String,
        externalAccountsNumber: rt.String,
        vatType: vatTypeRt,
        fixedprice: rt.Number,
        currency: currencyRt,
        markUpOrderLines: rt.Number,
        markUpFeesEarned: rt.Number,
        isPriceCeiling: rt.Boolean,
        priceCeilingAmount: rt.Number,
        projectHourlyRates: rt.Array(projectHourlyRateRt),
        forParticipantsOnly: rt.Boolean,
        participants: rt.Array(projectParticipantRt),
        contact: contactRt,
        attention: contactRt,
        invoiceComment: rt.String,
        generalProjectActivitiesPerProjectOnly: rt.Boolean,
        projectActivities: rt.Array(projectActivityRt),
      })
      .asPartial(),
    rt
      .Record({
        changes: rt.Array(changeRt),
        url: rt.String,
        displayName: rt.String,
        isOffer: rt.Boolean,
        discountPercentage: rt.Number,
        contributionMarginPercent: rt.Number,
        numberOfSubProjects: rt.Number,
        numberOfProjectParticipants: rt.Number,
        orderLines: rt.Array(projectOrderLineRt),
        invoicingPlan: rt.Array(invoiceRt),
        preliminaryInvoice: invoiceRt,
        hierarchyNameAndNumber: rt.String,
      })
      .asPartial()
      .asReadonly(),
  ),
);

type SalaryTransaction = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  date?: string;
  year?: number;
  month?: number;
  isHistorical?: boolean;
  paySlipsAvailableDate?: string;
  payslips?: Payslip[];
};

const salaryTransactionRt: rt.Runtype<SalaryTransaction> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        date: rt.String,
        year: rt.Number,
        month: rt.Number,
        isHistorical: rt.Boolean,
        paySlipsAvailableDate: rt.String,
        payslips: rt.Array(payslipRt),
      })
      .asPartial(),
    rt
      .Record({ changes: rt.Array(changeRt), url: rt.String })
      .asPartial()
      .asReadonly(),
  ),
);

const salaryTypeRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      number: rt.String,
      name: rt.String,
      description: rt.String,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      showInTimesheet: rt.Boolean,
    })
    .asPartial()
    .asReadonly(),
);

type SalaryType = rt.Static<typeof salaryTypeRt>;

type SalarySpecification = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  rate?: number;
  count?: number;
  project?: Project;
  department?: Department;
  salaryType?: SalaryType;
  payslip?: Payslip;
  employee?: Employee;
  description?: string;
  year?: number;
  month?: number;
  amount?: number;
};

const salarySpecificationRt: rt.Runtype<SalarySpecification> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        rate: rt.Number,
        count: rt.Number,
        project: projectRt,
        department: departmentRt,
        salaryType: salaryTypeRt,
        payslip: payslipRt,
        employee: employeeRt,
        description: rt.String,
        year: rt.Number,
        month: rt.Number,
        amount: rt.Number,
      })
      .asPartial(),
    rt
      .Record({ changes: rt.Array(changeRt), url: rt.String })
      .asPartial()
      .asReadonly(),
  ),
);

type Payslip = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  transaction?: SalaryTransaction;
  employee?: Employee;
  date?: string;
  year?: number;
  month?: number;
  specifications?: SalarySpecification[];
  readonly vacationAllowanceAmount?: number;
  readonly grossAmount?: number;
  readonly amount?: number;
  readonly number?: number;
};

const payslipRt: rt.Runtype<Payslip> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        transaction: salaryTransactionRt,
        employee: employeeRt,
        date: rt.String,
        year: rt.Number,
        month: rt.Number,
        specifications: rt.Array(salarySpecificationRt),
      })
      .asPartial(),
    rt
      .Record({
        changes: rt.Array(changeRt),
        url: rt.String,
        vacationAllowanceAmount: rt.Number,
        grossAmount: rt.Number,
        amount: rt.Number,
        number: rt.Number,
      })
      .asPartial()
      .asReadonly(),
  ),
);

const travelDetailsRt = rt
  .Record({
    isForeignTravel: rt.Boolean,
    isDayTrip: rt.Boolean,
    isCompensationFromRates: rt.Boolean,
    departureDate: rt.String,
    returnDate: rt.String,
    detailedJourneyDescription: rt.String,
    departureFrom: rt.String,
    destination: rt.String,
    departureTime: rt.String,
    returnTime: rt.String,
    purpose: rt.String,
  })
  .asPartial();

type TravelDetails = rt.Static<typeof travelDetailsRt>;

const travelExpenseRateCategoryRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      ameldingWageCode: rt.Number,
      wageCodeNumber: rt.String,
      isValidDayTrip: rt.Boolean,
      isValidAccommodation: rt.Boolean,
      isValidDomestic: rt.Boolean,
      isValidForeignTravel: rt.Boolean,
      isRequiresZone: rt.Boolean,
      isRequiresOvernightAccommodation: rt.Boolean,
      fromDate: rt.String,
      toDate: rt.String,
      type: rt.Union(
        rt.Literal('PER_DIEM'),
        rt.Literal('ACCOMMODATION_ALLOWANCE'),
        rt.Literal('MILEAGE_ALLOWANCE'),
      ),
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String, name: rt.String })
    .asPartial()
    .asReadonly(),
);

type TravelExpenseRateCategory = rt.Static<typeof travelExpenseRateCategoryRt>;

const travelExpenseRateRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      rateCategory: travelExpenseRateCategoryRt,
      zone: rt.String,
      rate: rt.Number,
      breakfastDeductionRate: rt.Number,
      lunchDeductionRate: rt.Number,
      dinnerDeductionRate: rt.Number,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type TravelExpenseRate = rt.Static<typeof travelExpenseRateRt>;

type PerDiemCompensation = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  travelExpense?: TravelExpense;
  rateType?: TravelExpenseRate;
  rateCategory?: TravelExpenseRateCategory;
  countryCode?: string;
  travelExpenseZoneId?: number;
  overnightAccommodation?:
    | 'NONE'
    | 'HOTEL'
    | 'BOARDING_HOUSE_WITHOUT_COOKING'
    | 'BOARDING_HOUSE_WITH_COOKING';
  location?: string;
  address?: string;
  count?: number;
  rate?: number;
  amount?: number;
  isDeductionForBreakfast?: boolean;
  isDeductionForLunch?: boolean;
  isDeductionForDinner?: boolean;
};

const perDiemCompensationRt: rt.Runtype<PerDiemCompensation> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        travelExpense: travelExpenseRt,
        rateType: travelExpenseRateRt,
        rateCategory: travelExpenseRateCategoryRt,
        countryCode: rt.String,
        travelExpenseZoneId: rt.Number,
        overnightAccommodation: rt.Union(
          rt.Literal('NONE'),
          rt.Literal('HOTEL'),
          rt.Literal('BOARDING_HOUSE_WITHOUT_COOKING'),
          rt.Literal('BOARDING_HOUSE_WITH_COOKING'),
        ),
        location: rt.String,
        address: rt.String,
        count: rt.Number,
        rate: rt.Number,
        amount: rt.Number,
        isDeductionForBreakfast: rt.Boolean,
        isDeductionForLunch: rt.Boolean,
        isDeductionForDinner: rt.Boolean,
      })
      .asPartial(),
    rt
      .Record({ changes: rt.Array(changeRt), url: rt.String })
      .asPartial()
      .asReadonly(),
  ),
);

type Passenger = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  name?: string;
  mileageAllowance?: MileageAllowance;
};

const passengerRt: rt.Runtype<Passenger> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        name: rt.String,
        mileageAllowance: mileageAllowanceRt,
      })
      .asPartial(),
    rt
      .Record({ changes: rt.Array(changeRt), url: rt.String })
      .asPartial()
      .asReadonly(),
  ),
);

const travelCostCategoryRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      description: rt.String,
      account: accountRt,
      vatType: vatTypeRt,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      isVatLocked: rt.Boolean,
      showOnTravelExpenses: rt.Boolean,
      showOnEmployeeExpenses: rt.Boolean,
      isInactive: rt.Boolean,
    })
    .asPartial()
    .asReadonly(),
);

type TravelCostCategory = rt.Static<typeof travelCostCategoryRt>;

const travelPaymentTypeRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      description: rt.String,
      account: accountRt,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      showOnTravelExpenses: rt.Boolean,
      showOnEmployeeExpenses: rt.Boolean,
      isInactive: rt.Boolean,
    })
    .asPartial()
    .asReadonly(),
);

type TravelPaymentType = rt.Static<typeof travelPaymentTypeRt>;

type Cost = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  travelExpense?: TravelExpense;
  vatType?: VatType;
  currency?: Currency;
  costCategory?: TravelCostCategory;
  paymentType?: TravelPaymentType;
  category?: string;
  comments?: string;
  rate?: number;
  amountCurrencyIncVat?: number;
  amountNOKInclVAT?: number;
  readonly amountNOKInclVATLow?: number;
  readonly amountNOKInclVATMedium?: number;
  readonly amountNOKInclVATHigh?: number;
  readonly isPaidByEmployee?: boolean;
  isChargeable?: boolean;
  date?: string;
  predictions?: Record<string, unknown>;
};

const costRt: rt.Runtype<Cost> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        travelExpense: travelExpenseRt,
        vatType: vatTypeRt,
        currency: currencyRt,
        costCategory: travelCostCategoryRt,
        paymentType: travelPaymentTypeRt,
        category: rt.String,
        comments: rt.String,
        rate: rt.Number,
        amountCurrencyIncVat: rt.Number,
        amountNOKInclVAT: rt.Number,
        isChargeable: rt.Boolean,
        date: rt.String,
        predictions: rt.Dictionary(rt.Unknown),
      })
      .asPartial(),
    rt
      .Record({
        changes: rt.Array(changeRt),
        url: rt.String,
        amountNOKInclVATLow: rt.Number,
        amountNOKInclVATMedium: rt.Number,
        amountNOKInclVATHigh: rt.Number,
        isPaidByEmployee: rt.Boolean,
      })
      .asPartial()
      .asReadonly(),
  ),
);

type MileageAllowance = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  travelExpense?: TravelExpense;
  rateType?: TravelExpenseRate;
  rateCategory?: TravelExpenseRateCategory;
  date?: string;
  departureLocation?: string;
  destination?: string;
  km?: number;
  rate?: number;
  amount?: number;
  isCompanyCar?: boolean;
  readonly passengers?: Passenger[];
  passengerSupplement?: MileageAllowance;
  tollCost?: Cost;
};

const mileageAllowanceRt: rt.Runtype<MileageAllowance> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        travelExpense: travelExpenseRt,
        rateType: travelExpenseRateRt,
        rateCategory: travelExpenseRateCategoryRt,
        date: rt.String,
        departureLocation: rt.String,
        destination: rt.String,
        km: rt.Number,
        rate: rt.Number,
        amount: rt.Number,
        isCompanyCar: rt.Boolean,
        passengerSupplement: mileageAllowanceRt,
        tollCost: costRt,
      })
      .asPartial(),
    rt
      .Record({
        changes: rt.Array(changeRt),
        url: rt.String,
        passengers: rt.Array(passengerRt),
      })
      .asPartial()
      .asReadonly(),
  ),
);

const linkRt = rt
  .Record({
    rel: rt.String,
    type: rt.Union(
      rt.Literal('POST'),
      rt.Literal('PUT'),
      rt.Literal('GET'),
      rt.Literal('DELETE'),
    ),
    href: rt.String,
  })
  .asPartial();

type Link = rt.Static<typeof linkRt>;

type TravelExpense = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  project?: Project;
  employee?: Employee;
  readonly approvedBy?: Employee;
  readonly completedBy?: Employee;
  department?: Department;
  readonly payslip?: Payslip;
  vatType?: VatType;
  paymentCurrency?: Currency;
  travelDetails?: TravelDetails;
  readonly voucher?: Voucher;
  readonly attachment?: Document;
  readonly isCompleted?: boolean;
  readonly isApproved?: boolean;
  isChargeable?: boolean;
  isFixedInvoicedAmount?: boolean;
  isIncludeAttachedReceiptsWhenReinvoicing?: boolean;
  readonly completedDate?: string;
  readonly approvedDate?: string;
  readonly date?: string;
  travelAdvance?: number;
  fixedInvoicedAmount?: number;
  readonly amount?: number;
  readonly paymentAmount?: number;
  readonly chargeableAmount?: number;
  readonly lowRateVAT?: number;
  readonly mediumRateVAT?: number;
  readonly highRateVAT?: number;
  readonly paymentAmountCurrency?: number;
  readonly number?: number;
  readonly invoice?: Invoice;
  title?: string;
  perDiemCompensations?: PerDiemCompensation[];
  readonly mileageAllowances?: MileageAllowance[];
  readonly accommodationAllowances?: AccommodationAllowance[];
  costs?: Cost[];
  readonly attachmentCount?: number;
  readonly state?: 'ALL' | 'OPEN' | 'APPROVED' | 'SALARY_PAID' | 'DELIVERED';
  readonly actions?: Link[];
  readonly isSalaryAdmin?: boolean;
  readonly showPayslip?: boolean;
  readonly accountingPeriodClosed?: boolean;
  readonly accountingPeriodVATClosed?: boolean;
};

const travelExpenseRt: rt.Runtype<TravelExpense> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        project: projectRt,
        employee: employeeRt,
        department: departmentRt,
        vatType: vatTypeRt,
        paymentCurrency: currencyRt,
        travelDetails: travelDetailsRt,
        isChargeable: rt.Boolean,
        isFixedInvoicedAmount: rt.Boolean,
        isIncludeAttachedReceiptsWhenReinvoicing: rt.Boolean,
        travelAdvance: rt.Number,
        fixedInvoicedAmount: rt.Number,
        title: rt.String,
        perDiemCompensations: rt.Array(perDiemCompensationRt),
        costs: rt.Array(costRt),
      })
      .asPartial(),
    rt
      .Record({
        changes: rt.Array(changeRt),
        url: rt.String,
        approvedBy: employeeRt,
        completedBy: employeeRt,
        payslip: payslipRt,
        voucher: voucherRt,
        attachment: documentRt,
        isCompleted: rt.Boolean,
        isApproved: rt.Boolean,
        completedDate: rt.String,
        approvedDate: rt.String,
        date: rt.String,
        amount: rt.Number,
        paymentAmount: rt.Number,
        chargeableAmount: rt.Number,
        lowRateVAT: rt.Number,
        mediumRateVAT: rt.Number,
        highRateVAT: rt.Number,
        paymentAmountCurrency: rt.Number,
        number: rt.Number,
        invoice: invoiceRt,
        mileageAllowances: rt.Array(mileageAllowanceRt),
        accommodationAllowances: rt.Array(accommodationAllowanceRt),
        attachmentCount: rt.Number,
        state: rt.Union(
          rt.Literal('ALL'),
          rt.Literal('OPEN'),
          rt.Literal('APPROVED'),
          rt.Literal('SALARY_PAID'),
          rt.Literal('DELIVERED'),
        ),
        actions: rt.Array(linkRt),
        isSalaryAdmin: rt.Boolean,
        showPayslip: rt.Boolean,
        accountingPeriodClosed: rt.Boolean,
        accountingPeriodVATClosed: rt.Boolean,
      })
      .asPartial()
      .asReadonly(),
  ),
);

type AccommodationAllowance = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  travelExpense?: TravelExpense;
  rateType?: TravelExpenseRate;
  rateCategory?: TravelExpenseRateCategory;
  zone?: string;
  location?: string;
  address?: string;
  count?: number;
  rate?: number;
  amount?: number;
};

const accommodationAllowanceRt: rt.Runtype<AccommodationAllowance> = rt.Lazy(
  () =>
    rt.Intersect(
      rt
        .Record({
          id: rt.Number,
          version: rt.Number,
          travelExpense: travelExpenseRt,
          rateType: travelExpenseRateRt,
          rateCategory: travelExpenseRateCategoryRt,
          zone: rt.String,
          location: rt.String,
          address: rt.String,
          count: rt.Number,
          rate: rt.Number,
          amount: rt.Number,
        })
        .asPartial(),
      rt
        .Record({ changes: rt.Array(changeRt), url: rt.String })
        .asPartial()
        .asReadonly(),
    ),
);

const accountingPeriodRt = rt.Intersect(
  rt.Record({ id: rt.Number, version: rt.Number }).asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      name: rt.String,
      number: rt.Number,
      start: rt.String,
      end: rt.String,
      isClosed: rt.Boolean,
    })
    .asPartial()
    .asReadonly(),
);

type AccountingPeriod = rt.Static<typeof accountingPeriodRt>;

type BankStatement = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  readonly openingBalanceCurrency?: number;
  readonly closingBalanceCurrency?: number;
  readonly fileName?: string;
  readonly bank?: Bank;
  readonly fromDate?: string;
  readonly toDate?: string;
  readonly transactions?: BankTransaction[];
};

const bankStatementRt: rt.Runtype<BankStatement> = rt.Lazy(() =>
  rt.Intersect(
    rt.Record({ id: rt.Number, version: rt.Number }).asPartial(),
    rt
      .Record({
        changes: rt.Array(changeRt),
        url: rt.String,
        openingBalanceCurrency: rt.Number,
        closingBalanceCurrency: rt.Number,
        fileName: rt.String,
        bank: bankRt,
        fromDate: rt.String,
        toDate: rt.String,
        transactions: rt.Array(bankTransactionRt),
      })
      .asPartial()
      .asReadonly(),
  ),
);

type BankTransaction = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  postedDate?: string;
  description?: string;
  amountCurrency?: number;
  bankStatement?: BankStatement;
};

const bankTransactionRt: rt.Runtype<BankTransaction> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        postedDate: rt.String,
        description: rt.String,
        amountCurrency: rt.Number,
        bankStatement: bankStatementRt,
      })
      .asPartial(),
    rt
      .Record({ changes: rt.Array(changeRt), url: rt.String })
      .asPartial()
      .asReadonly(),
  ),
);

const bankReconciliationRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      account: accountRt,
      accountingPeriod: accountingPeriodRt,
      isClosed: rt.Boolean,
      type: rt.Union(rt.Literal('MANUAL'), rt.Literal('AUTOMATIC')),
      bankAccountClosingBalanceCurrency: rt.Number,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      voucher: voucherRt,
      transactions: rt.Array(bankTransactionRt),
      closedDate: rt.String,
      closedByContact: contactRt,
      closedByEmployee: employeeRt,
      approvable: rt.Boolean,
    })
    .asPartial()
    .asReadonly(),
);

type BankReconciliation = rt.Static<typeof bankReconciliationRt>;

const predictionRt = rt
  .Record({ predictedValue: rt.String, confidence: rt.String })
  .asPartial();

type Prediction = rt.Static<typeof predictionRt>;

const responseWrapperBankReconciliationRt = rt
  .Record({ value: bankReconciliationRt })
  .asPartial();

type ResponseWrapperBankReconciliation = rt.Static<
  typeof responseWrapperBankReconciliationRt
>;

const listResponseBankReconciliationRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(bankReconciliationRt),
  })
  .asPartial();

type ListResponseBankReconciliation = rt.Static<
  typeof listResponseBankReconciliationRt
>;

const bankReconciliationPaymentTypeRt = rt.Intersect(
  rt.Record({ id: rt.Number, version: rt.Number }).asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      description: rt.String,
      debitAccount: accountRt,
      creditAccount: accountRt,
      isInactive: rt.Boolean,
    })
    .asPartial()
    .asReadonly(),
);

type BankReconciliationPaymentType = rt.Static<
  typeof bankReconciliationPaymentTypeRt
>;

const bankReconciliationMatchRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      bankReconciliation: bankReconciliationRt,
      type: rt.Union(
        rt.Literal('MANUAL'),
        rt.Literal('PENDING_SUGGESTION'),
        rt.Literal('REJECTED_SUGGESTION'),
        rt.Literal('APPROVED_SUGGESTION'),
        rt.Literal('ADJUSTMENT'),
        rt.Literal('AUTO_MATCHED'),
        rt.Literal('REJECTED_AUTO_MATCH'),
      ),
      transactions: rt.Array(bankTransactionRt),
      postings: rt.Array(postingRt),
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type BankReconciliationMatch = rt.Static<typeof bankReconciliationMatchRt>;

const bankReconciliationAdjustmentRt = rt.Intersect(
  rt
    .Record({
      paymentType: bankReconciliationPaymentTypeRt,
      bankTransactions: rt.Array(bankTransactionRt),
      postingDate: rt.String,
      amount: rt.Number,
      postings: rt.Array(postingRt),
    })
    .asPartial(),
  rt
    .Record({ bankReconciliationMatch: bankReconciliationMatchRt })
    .asPartial()
    .asReadonly(),
);

type BankReconciliationAdjustment = rt.Static<
  typeof bankReconciliationAdjustmentRt
>;

const listResponseBankReconciliationAdjustmentRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(bankReconciliationAdjustmentRt),
  })
  .asPartial();

type ListResponseBankReconciliationAdjustment = rt.Static<
  typeof listResponseBankReconciliationAdjustmentRt
>;

const fileIdForIncomingPaymentsDTORt = rt
  .Record({
    fileId: rt.Number,
    date: rt.String,
    accountNumber: rt.String,
    postingIds: rt.Array(rt.Number),
  })
  .asPartial()
  .asReadonly();

type FileIdForIncomingPaymentsDTO = rt.Static<
  typeof fileIdForIncomingPaymentsDTORt
>;

const responseWrapperListFileIdForIncomingPaymentsDTORt = rt
  .Record({ value: rt.Array(fileIdForIncomingPaymentsDTORt) })
  .asPartial();

type ResponseWrapperListFileIdForIncomingPaymentsDTO = rt.Static<
  typeof responseWrapperListFileIdForIncomingPaymentsDTORt
>;

const responseWrapperBankReconciliationMatchRt = rt
  .Record({ value: bankReconciliationMatchRt })
  .asPartial();

type ResponseWrapperBankReconciliationMatch = rt.Static<
  typeof responseWrapperBankReconciliationMatchRt
>;

const listResponseBankReconciliationMatchRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(bankReconciliationMatchRt),
  })
  .asPartial();

type ListResponseBankReconciliationMatch = rt.Static<
  typeof listResponseBankReconciliationMatchRt
>;

const responseWrapperBankReconciliationPaymentTypeRt = rt
  .Record({ value: bankReconciliationPaymentTypeRt })
  .asPartial();

type ResponseWrapperBankReconciliationPaymentType = rt.Static<
  typeof responseWrapperBankReconciliationPaymentTypeRt
>;

const listResponseBankReconciliationPaymentTypeRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(bankReconciliationPaymentTypeRt),
  })
  .asPartial();

type ListResponseBankReconciliationPaymentType = rt.Static<
  typeof listResponseBankReconciliationPaymentTypeRt
>;

const bankSettingsRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      taxBankAgreement: bankAgreementRt,
      remitNumberOfAcceptors: rt.Number,
      showAdviceCurrencyMismatch: rt.Boolean,
      parsePaymentsWithUnknownKID: rt.Boolean,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      employeesWithDirectRemitAccess: rt.Array(employeeRt),
    })
    .asPartial()
    .asReadonly(),
);

type BankSettings = rt.Static<typeof bankSettingsRt>;

const responseWrapperBankSettingsRt = rt
  .Record({ value: bankSettingsRt })
  .asPartial();

type ResponseWrapperBankSettings = rt.Static<
  typeof responseWrapperBankSettingsRt
>;

const responseWrapperBankStatementRt = rt
  .Record({ value: bankStatementRt })
  .asPartial();

type ResponseWrapperBankStatement = rt.Static<
  typeof responseWrapperBankStatementRt
>;

const bankStatementBalanceDTORt = rt
  .Record({ amount: rt.Number, date: rt.String })
  .asPartial()
  .asReadonly();

type BankStatementBalanceDTO = rt.Static<typeof bankStatementBalanceDTORt>;

const responseWrapperBankStatementBalanceDTORt = rt
  .Record({ value: bankStatementBalanceDTORt })
  .asPartial();

type ResponseWrapperBankStatementBalanceDTO = rt.Static<
  typeof responseWrapperBankStatementBalanceDTORt
>;

const listResponseBankStatementRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(bankStatementRt),
  })
  .asPartial();

type ListResponseBankStatement = rt.Static<typeof listResponseBankStatementRt>;

const tlxNumberRt = rt.Dictionary(rt.Unknown);

type TlxNumber = rt.Static<typeof tlxNumberRt>;

const bankBalanceEstimationRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      date: rt.String,
      description: rt.String,
      voucherId: rt.Number,
      invoiceId: rt.Number,
      invoiceNumber: rt.String,
      invoiceAmount: tlxNumberRt,
      isIncomingInvoice: rt.Boolean,
      recurrence: rt.Union(
        rt.Literal('NONE'),
        rt.Literal('DAILY'),
        rt.Literal('WEEKLY'),
        rt.Literal('MONTHLY'),
      ),
      category: rt.Union(
        rt.Literal('STARTING_BALANCE'),
        rt.Literal('NONE'),
        rt.Literal('SALARY'),
        rt.Literal('ENI'),
        rt.Literal('TAX'),
        rt.Literal('VAT_RETURNS'),
      ),
      vendorOrCustomerName: rt.String,
      isManuallyAdded: rt.Boolean,
      batchId: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type BankBalanceEstimation = rt.Static<typeof bankBalanceEstimationRt>;

const responseWrapperBankBalanceEstimationRt = rt
  .Record({ value: bankBalanceEstimationRt })
  .asPartial();

type ResponseWrapperBankBalanceEstimation = rt.Static<
  typeof responseWrapperBankBalanceEstimationRt
>;

const responseWrapperListBankBalanceEstimationRt = rt
  .Record({ value: rt.Array(bankBalanceEstimationRt) })
  .asPartial();

type ResponseWrapperListBankBalanceEstimation = rt.Static<
  typeof responseWrapperListBankBalanceEstimationRt
>;

const listResponseBankBalanceEstimationRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(bankBalanceEstimationRt),
  })
  .asPartial();

type ListResponseBankBalanceEstimation = rt.Static<
  typeof listResponseBankBalanceEstimationRt
>;

const responseWrapperObjectRt = rt
  .Record({ value: rt.Dictionary(rt.Unknown) })
  .asPartial();

type ResponseWrapperObject = rt.Static<typeof responseWrapperObjectRt>;

const responseWrapperBankTransactionRt = rt
  .Record({ value: bankTransactionRt })
  .asPartial();

type ResponseWrapperBankTransaction = rt.Static<
  typeof responseWrapperBankTransactionRt
>;

const listResponseBankTransactionRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(bankTransactionRt),
  })
  .asPartial();

type ListResponseBankTransaction = rt.Static<
  typeof listResponseBankTransactionRt
>;

const bannerRt = rt.Intersect(
  rt.Record({ id: rt.Number, version: rt.Number }).asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      bannerType: rt.String,
      title: rt.String,
      message: rt.String,
      button: rt.String,
      link: rt.String,
      tag: rt.String,
      done: rt.Boolean,
      cancellable: rt.Boolean,
    })
    .asPartial()
    .asReadonly(),
);

type Banner = rt.Static<typeof bannerRt>;

const responseWrapperBannerRt = rt.Record({ value: bannerRt }).asPartial();

type ResponseWrapperBanner = rt.Static<typeof responseWrapperBannerRt>;

const listResponseBannerRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(bannerRt),
  })
  .asPartial();

type ListResponseBanner = rt.Static<typeof listResponseBannerRt>;

const apiConsumerRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      consumerName: rt.String,
      emails: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type ApiConsumer = rt.Static<typeof apiConsumerRt>;

const responseWrapperApiConsumerRt = rt
  .Record({ value: apiConsumerRt })
  .asPartial();

type ResponseWrapperApiConsumer = rt.Static<
  typeof responseWrapperApiConsumerRt
>;

const listResponseApiConsumerRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(apiConsumerRt),
  })
  .asPartial();

type ListResponseApiConsumer = rt.Static<typeof listResponseApiConsumerRt>;

const consumerTokenRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      apiConsumer: apiConsumerRt,
      token: rt.String,
      expirationDate: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type ConsumerToken = rt.Static<typeof consumerTokenRt>;

const responseWrapperConsumerTokenRt = rt
  .Record({ value: consumerTokenRt })
  .asPartial();

type ResponseWrapperConsumerToken = rt.Static<
  typeof responseWrapperConsumerTokenRt
>;

const apiValidationMessageRt = rt
  .Record({
    field: rt.String,
    message: rt.String,
    path: rt.String,
    rootId: rt.Number,
  })
  .asPartial();

type ApiValidationMessage = rt.Static<typeof apiValidationMessageRt>;

const apiErrorRt = rt
  .Record({
    status: rt.Number,
    code: rt.Number,
    message: rt.String,
    link: rt.String,
    developerMessage: rt.String,
    validationMessages: rt.Array(apiValidationMessageRt),
    requestId: rt.String,
  })
  .asPartial();

type ApiError = rt.Static<typeof apiErrorRt>;

const companyRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      name: rt.String,
      startDate: rt.String,
      endDate: rt.String,
      organizationNumber: rt.String,
      email: rt.String,
      phoneNumber: rt.String,
      phoneNumberMobile: rt.String,
      faxNumber: rt.String,
      address: addressRt,
      type: rt.Union(
        rt.Literal('NONE'),
        rt.Literal('ENK'),
        rt.Literal('AS'),
        rt.Literal('NUF'),
        rt.Literal('ANS'),
        rt.Literal('DA'),
        rt.Literal('PRE'),
        rt.Literal('KS'),
        rt.Literal('ASA'),
        rt.Literal('BBL'),
        rt.Literal('BRL'),
        rt.Literal('GFS'),
        rt.Literal('SPA'),
        rt.Literal('SF'),
        rt.Literal('IKS'),
        rt.Literal('KF_FKF'),
        rt.Literal('FCD'),
        rt.Literal('EOFG'),
        rt.Literal('BA'),
        rt.Literal('STI'),
        rt.Literal('ORG'),
        rt.Literal('ESEK'),
        rt.Literal('SA'),
        rt.Literal('SAM'),
        rt.Literal('BO'),
        rt.Literal('VPFO'),
        rt.Literal('OS'),
        rt.Literal('Other'),
      ),
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type Company = rt.Static<typeof companyRt>;

const employeeCompanyDTORt = rt
  .Record({ isDefault: rt.Boolean, company: companyRt, employee: employeeRt })
  .asPartial();

type EmployeeCompanyDTO = rt.Static<typeof employeeCompanyDTORt>;

const listResponseEmployeeCompanyDTORt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(employeeCompanyDTORt),
  })
  .asPartial();

type ListResponseEmployeeCompanyDTO = rt.Static<
  typeof listResponseEmployeeCompanyDTORt
>;

const credentialsRt = rt
  .Record({
    username: rt.String,
    password: rt.String,
    appSecret: rt.String,
    mfaCode: rt.Number,
  })
  .asPartial();

type Credentials = rt.Static<typeof credentialsRt>;

const employeeTokenRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      employee: employeeRt,
      apiConsumer: apiConsumerRt,
      token: rt.String,
      expirationDate: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type EmployeeToken = rt.Static<typeof employeeTokenRt>;

const employeeTokenBundleRt = rt
  .Record({
    employeeToken: employeeTokenRt,
    employee: employeeRt,
    robotEmployee: employeeRt,
  })
  .asPartial();

type EmployeeTokenBundle = rt.Static<typeof employeeTokenBundleRt>;

const responseWrapperEmployeeTokenBundleRt = rt
  .Record({ value: employeeTokenBundleRt })
  .asPartial();

type ResponseWrapperEmployeeTokenBundle = rt.Static<
  typeof responseWrapperEmployeeTokenBundleRt
>;

const responseWrapperEmployeeTokenRt = rt
  .Record({ value: employeeTokenRt })
  .asPartial();

type ResponseWrapperEmployeeToken = rt.Static<
  typeof responseWrapperEmployeeTokenRt
>;

const mobileAppLoginRt = rt
  .Record({
    username: rt.String,
    password: rt.String,
    appSecret: rt.String,
    mfaCode: rt.Number,
    expirationDate: rt.String,
    employeeId: rt.Number,
  })
  .asPartial();

type MobileAppLogin = rt.Static<typeof mobileAppLoginRt>;

const autoLoginRt = rt.Record({ loginUrl: rt.String }).asPartial().asReadonly();

type AutoLogin = rt.Static<typeof autoLoginRt>;

const responseWrapperAutoLoginRt = rt
  .Record({ value: autoLoginRt })
  .asPartial();

type ResponseWrapperAutoLogin = rt.Static<typeof responseWrapperAutoLoginRt>;

const autoLoginPayloadDTORt = rt
  .Record({ redirectPath: rt.String })
  .asPartial();

type AutoLoginPayloadDTO = rt.Static<typeof autoLoginPayloadDTORt>;

const sessionTokenRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      consumerToken: consumerTokenRt,
      employeeToken: employeeTokenRt,
      expirationDate: rt.String,
      token: rt.String,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      encryptionKey: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

type SessionToken = rt.Static<typeof sessionTokenRt>;

const responseWrapperSessionTokenRt = rt
  .Record({ value: sessionTokenRt })
  .asPartial();

type ResponseWrapperSessionToken = rt.Static<
  typeof responseWrapperSessionTokenRt
>;

const loggedInUserInfoDTORt = rt
  .Record({
    employeeId: rt.Number,
    employee: employeeRt,
    companyId: rt.Number,
    company: companyRt,
    language: rt.String,
  })
  .asPartial();

type LoggedInUserInfoDTO = rt.Static<typeof loggedInUserInfoDTORt>;

const responseWrapperLoggedInUserInfoDTORt = rt
  .Record({ value: loggedInUserInfoDTORt })
  .asPartial();

type ResponseWrapperLoggedInUserInfoDTO = rt.Static<
  typeof responseWrapperLoggedInUserInfoDTORt
>;

const listResponseCompanyRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(companyRt),
  })
  .asPartial();

type ListResponseCompany = rt.Static<typeof listResponseCompanyRt>;

const responseWrapperCompanyRt = rt.Record({ value: companyRt }).asPartial();

type ResponseWrapperCompany = rt.Static<typeof responseWrapperCompanyRt>;

const altinnCompanyModuleRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      altInnId: rt.Number,
      altInnPassword: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type AltinnCompanyModule = rt.Static<typeof altinnCompanyModuleRt>;

const responseWrapperAltinnCompanyModuleRt = rt
  .Record({ value: altinnCompanyModuleRt })
  .asPartial();

type ResponseWrapperAltinnCompanyModule = rt.Static<
  typeof responseWrapperAltinnCompanyModuleRt
>;

const companyAuthorityDTORt = rt
  .Record({
    hasCompanyAuthority: rt.Union(
      rt.Literal('DENIED'),
      rt.Literal('MANUAL_CHECK'),
      rt.Literal('ACCEPTED'),
    ),
  })
  .asPartial();

type CompanyAuthorityDTO = rt.Static<typeof companyAuthorityDTORt>;

const responseWrapperCompanyAuthorityDTORt = rt
  .Record({ value: companyAuthorityDTORt })
  .asPartial();

type ResponseWrapperCompanyAuthorityDTO = rt.Static<
  typeof responseWrapperCompanyAuthorityDTORt
>;

const modulesRt = rt.Intersect(
  rt
    .Record({
      accounting: rt.Boolean,
      invoice: rt.Boolean,
      salary: rt.Boolean,
      salaryStartDate: rt.String,
      project: rt.Boolean,
      ocr: rt.Boolean,
      remit: rt.Boolean,
      electronicVouchers: rt.Boolean,
      electro: rt.Boolean,
      vvs: rt.Boolean,
      agro: rt.Boolean,
      mamut: rt.Boolean,
    })
    .asPartial(),
  rt.Record({ approveVoucher: rt.Boolean }).asPartial().asReadonly(),
);

type Modules = rt.Static<typeof modulesRt>;

const responseWrapperModulesRt = rt.Record({ value: modulesRt }).asPartial();

type ResponseWrapperModules = rt.Static<typeof responseWrapperModulesRt>;

const salesModuleDTORt = rt
  .Record({
    name: rt.Union(
      rt.Literal('MAMUT'),
      rt.Literal('MAMUT_WITH_WAGE'),
      rt.Literal('AGRO_LICENCE'),
      rt.Literal('AGRO_CLIENT'),
      rt.Literal('AGRO_DOCUMENT_CENTER'),
      rt.Literal('AGRO_INVOICE'),
      rt.Literal('AGRO_INVOICE_MIGRATED'),
      rt.Literal('AGRO_WAGE'),
      rt.Literal('NO1TS'),
      rt.Literal('NO1TS_TRAVELREPORT'),
      rt.Literal('NO1TS_ACCOUNTING'),
      rt.Literal('BASIS'),
      rt.Literal('SMART'),
      rt.Literal('KOMPLETT'),
      rt.Literal('VVS'),
      rt.Literal('ELECTRO'),
      rt.Literal('ACCOUNTING_OFFICE'),
      rt.Literal('SMART_WAGE'),
      rt.Literal('SMART_TIME_TRACKING'),
      rt.Literal('SMART_PROJECT'),
      rt.Literal('OCR'),
      rt.Literal('ELECTRONIC_VOUCHERS'),
      rt.Literal('UP_TO_500_VOUCHERS'),
      rt.Literal('UP_TO_1000_VOUCHERS'),
      rt.Literal('UP_TO_2000_VOUCHERS'),
      rt.Literal('UP_TO_3500_VOUCHERS'),
      rt.Literal('UP_TO_5000_VOUCHERS'),
      rt.Literal('UP_TO_10000_VOUCHERS'),
      rt.Literal('UNLIMITED_VOUCHERS'),
    ),
    costStartDate: rt.String,
  })
  .asPartial();

type SalesModuleDTO = rt.Static<typeof salesModuleDTORt>;

const responseWrapperSalesModuleDTORt = rt
  .Record({ value: salesModuleDTORt })
  .asPartial();

type ResponseWrapperSalesModuleDTO = rt.Static<
  typeof responseWrapperSalesModuleDTORt
>;

const listResponseSalesModuleDTORt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(salesModuleDTORt),
  })
  .asPartial();

type ListResponseSalesModuleDTO = rt.Static<
  typeof listResponseSalesModuleDTORt
>;

const responseWrapperContactRt = rt.Record({ value: contactRt }).asPartial();

type ResponseWrapperContact = rt.Static<typeof responseWrapperContactRt>;

const listResponseContactRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(contactRt),
  })
  .asPartial();

type ListResponseContact = rt.Static<typeof listResponseContactRt>;

const responseWrapperCountryRt = rt.Record({ value: countryRt }).asPartial();

type ResponseWrapperCountry = rt.Static<typeof responseWrapperCountryRt>;

const listResponseCountryRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(countryRt),
  })
  .asPartial();

type ListResponseCountry = rt.Static<typeof listResponseCountryRt>;

const responseWrapperCurrencyRt = rt.Record({ value: currencyRt }).asPartial();

type ResponseWrapperCurrency = rt.Static<typeof responseWrapperCurrencyRt>;

const listResponseCurrencyRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(currencyRt),
  })
  .asPartial();

type ListResponseCurrency = rt.Static<typeof listResponseCurrencyRt>;

const currencyExchangeRateRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      targetCurrency: currencyRt,
      sourceCurrency: currencyRt,
      rate: rt.Number,
      source: rt.Union(rt.Literal('NORGES_BANK'), rt.Literal('HALLONEN')),
      date: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type CurrencyExchangeRate = rt.Static<typeof currencyExchangeRateRt>;

const responseWrapperCurrencyExchangeRateRt = rt
  .Record({ value: currencyExchangeRateRt })
  .asPartial();

type ResponseWrapperCurrencyExchangeRate = rt.Static<
  typeof responseWrapperCurrencyExchangeRateRt
>;

const responseWrapperCustomerRt = rt.Record({ value: customerRt }).asPartial();

type ResponseWrapperCustomer = rt.Static<typeof responseWrapperCustomerRt>;

const listResponseCustomerRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(customerRt),
  })
  .asPartial();

type ListResponseCustomer = rt.Static<typeof listResponseCustomerRt>;

const responseWrapperCustomerCategoryRt = rt
  .Record({ value: customerCategoryRt })
  .asPartial();

type ResponseWrapperCustomerCategory = rt.Static<
  typeof responseWrapperCustomerCategoryRt
>;

const listResponseCustomerCategoryRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(customerCategoryRt),
  })
  .asPartial();

type ListResponseCustomerCategory = rt.Static<
  typeof listResponseCustomerCategoryRt
>;

const dashboardDTORt = rt
  .Record({ version: rt.Number, content: rt.String })
  .asPartial();

type DashboardDTO = rt.Static<typeof dashboardDTORt>;

const responseWrapperDashboardDTORt = rt
  .Record({ value: dashboardDTORt })
  .asPartial();

type ResponseWrapperDashboardDTO = rt.Static<
  typeof responseWrapperDashboardDTORt
>;

const responseWrapperDepartmentRt = rt
  .Record({ value: departmentRt })
  .asPartial();

type ResponseWrapperDepartment = rt.Static<typeof responseWrapperDepartmentRt>;

const listResponseDepartmentRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(departmentRt),
  })
  .asPartial();

type ListResponseDepartment = rt.Static<typeof listResponseDepartmentRt>;

const responseWrapperDivisionRt = rt.Record({ value: divisionRt }).asPartial();

type ResponseWrapperDivision = rt.Static<typeof responseWrapperDivisionRt>;

const listResponseDivisionRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(divisionRt),
  })
  .asPartial();

type ListResponseDivision = rt.Static<typeof listResponseDivisionRt>;

const responseWrapperDocumentRt = rt.Record({ value: documentRt }).asPartial();

type ResponseWrapperDocument = rt.Static<typeof responseWrapperDocumentRt>;

const documentArchiveRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      fileName: rt.String,
      archiveDate: rt.String,
      mimeType: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String, size: rt.Number })
    .asPartial()
    .asReadonly(),
);

type DocumentArchive = rt.Static<typeof documentArchiveRt>;

const responseWrapperDocumentArchiveRt = rt
  .Record({ value: documentArchiveRt })
  .asPartial();

type ResponseWrapperDocumentArchive = rt.Static<
  typeof responseWrapperDocumentArchiveRt
>;

const listResponseDocumentArchiveRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(documentArchiveRt),
  })
  .asPartial();

type ListResponseDocumentArchive = rt.Static<
  typeof listResponseDocumentArchiveRt
>;

const responseWrapperEmployeeRt = rt.Record({ value: employeeRt }).asPartial();

type ResponseWrapperEmployee = rt.Static<typeof responseWrapperEmployeeRt>;

const listResponseEmployeeRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(employeeRt),
  })
  .asPartial();

type ListResponseEmployee = rt.Static<typeof listResponseEmployeeRt>;

const employeeEmailRt = rt.Record({ email: rt.String }).asPartial();

type EmployeeEmail = rt.Static<typeof employeeEmailRt>;

const responseWrapperEmployeeCategoryRt = rt
  .Record({ value: employeeCategoryRt })
  .asPartial();

type ResponseWrapperEmployeeCategory = rt.Static<
  typeof responseWrapperEmployeeCategoryRt
>;

const listResponseEmployeeCategoryRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(employeeCategoryRt),
  })
  .asPartial();

type ListResponseEmployeeCategory = rt.Static<
  typeof listResponseEmployeeCategoryRt
>;

const responseWrapperEmploymentRt = rt
  .Record({ value: employmentRt })
  .asPartial();

type ResponseWrapperEmployment = rt.Static<typeof responseWrapperEmploymentRt>;

const listResponseEmploymentRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(employmentRt),
  })
  .asPartial();

type ListResponseEmployment = rt.Static<typeof listResponseEmploymentRt>;

const responseWrapperEmploymentDetailsRt = rt
  .Record({ value: employmentDetailsRt })
  .asPartial();

type ResponseWrapperEmploymentDetails = rt.Static<
  typeof responseWrapperEmploymentDetailsRt
>;

const listResponseEmploymentDetailsRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(employmentDetailsRt),
  })
  .asPartial();

type ListResponseEmploymentDetails = rt.Static<
  typeof listResponseEmploymentDetailsRt
>;

const employmentTypeRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      employmentType: rt.Union(
        rt.Literal('ORDINARY'),
        rt.Literal('MARITIME'),
        rt.Literal('FREELANCE'),
      ),
      nameNO: rt.String,
      code: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type EmploymentType = rt.Static<typeof employmentTypeRt>;

const listResponseEmploymentTypeRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(employmentTypeRt),
  })
  .asPartial();

type ListResponseEmploymentType = rt.Static<
  typeof listResponseEmploymentTypeRt
>;

const leaveOfAbsenceRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      employment: employmentRt,
      leaveOfAbsenceId: rt.String,
      startDate: rt.String,
      endDate: rt.String,
      percentage: rt.Number,
      isWageDeduction: rt.Boolean,
      type: rt.Union(
        rt.Literal('LEAVE_OF_ABSENCE'),
        rt.Literal('FURLOUGH'),
        rt.Literal('PARENTAL_BENEFITS'),
        rt.Literal('MILITARY_SERVICE'),
        rt.Literal('EDUCATIONAL'),
        rt.Literal('COMPASSIONATE'),
      ),
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type LeaveOfAbsence = rt.Static<typeof leaveOfAbsenceRt>;

const responseWrapperLeaveOfAbsenceRt = rt
  .Record({ value: leaveOfAbsenceRt })
  .asPartial();

type ResponseWrapperLeaveOfAbsence = rt.Static<
  typeof responseWrapperLeaveOfAbsenceRt
>;

const listResponseLeaveOfAbsenceRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(leaveOfAbsenceRt),
  })
  .asPartial();

type ListResponseLeaveOfAbsence = rt.Static<
  typeof listResponseLeaveOfAbsenceRt
>;

const leaveOfAbsenceTypeRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      leaveOfAbsenceType: rt.Union(
        rt.Literal('LEAVE_OF_ABSENCE'),
        rt.Literal('FURLOUGH'),
        rt.Literal('PARENTAL_BENEFITS'),
        rt.Literal('MILITARY_SERVICE'),
        rt.Literal('EDUCATIONAL'),
        rt.Literal('COMPASSIONATE'),
      ),
      nameNO: rt.String,
      code: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type LeaveOfAbsenceType = rt.Static<typeof leaveOfAbsenceTypeRt>;

const listResponseLeaveOfAbsenceTypeRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(leaveOfAbsenceTypeRt),
  })
  .asPartial();

type ListResponseLeaveOfAbsenceType = rt.Static<
  typeof listResponseLeaveOfAbsenceTypeRt
>;

const listResponseOccupationCodeRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(occupationCodeRt),
  })
  .asPartial();

type ListResponseOccupationCode = rt.Static<
  typeof listResponseOccupationCodeRt
>;

const remunerationTypeRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      remunerationType: rt.Union(
        rt.Literal('MONTHLY_WAGE'),
        rt.Literal('HOURLY_WAGE'),
        rt.Literal('COMMISION_PERCENTAGE'),
        rt.Literal('FEE'),
        rt.Literal('PIECEWORK_WAGE'),
      ),
      nameNO: rt.String,
      code: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type RemunerationType = rt.Static<typeof remunerationTypeRt>;

const listResponseRemunerationTypeRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(remunerationTypeRt),
  })
  .asPartial();

type ListResponseRemunerationType = rt.Static<
  typeof listResponseRemunerationTypeRt
>;

const workingHoursSchemeRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      workingHoursScheme: rt.Union(
        rt.Literal('NOT_SHIFT'),
        rt.Literal('ROUND_THE_CLOCK'),
        rt.Literal('SHIFT_365'),
        rt.Literal('OFFSHORE_336'),
        rt.Literal('CONTINUOUS'),
        rt.Literal('OTHER_SHIFT'),
      ),
      nameNO: rt.String,
      code: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type WorkingHoursScheme = rt.Static<typeof workingHoursSchemeRt>;

const listResponseWorkingHoursSchemeRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(workingHoursSchemeRt),
  })
  .asPartial();

type ListResponseWorkingHoursScheme = rt.Static<
  typeof listResponseWorkingHoursSchemeRt
>;

const hourlyCostAndRateRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      employee: employeeRt,
      date: rt.String,
      rate: rt.Number,
      budgetRate: rt.Number,
      hourCostRate: rt.Number,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type HourlyCostAndRate = rt.Static<typeof hourlyCostAndRateRt>;

const responseWrapperHourlyCostAndRateRt = rt
  .Record({ value: hourlyCostAndRateRt })
  .asPartial();

type ResponseWrapperHourlyCostAndRate = rt.Static<
  typeof responseWrapperHourlyCostAndRateRt
>;

const listResponseHourlyCostAndRateRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(hourlyCostAndRateRt),
  })
  .asPartial();

type ListResponseHourlyCostAndRate = rt.Static<
  typeof listResponseHourlyCostAndRateRt
>;

const nextOfKinRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      employee: employeeRt,
      name: rt.String,
      phoneNumber: rt.String,
      address: rt.String,
      typeOfRelationship: rt.Union(
        rt.Literal('SPOUSE'),
        rt.Literal('PARTNER'),
        rt.Literal('PARENT'),
        rt.Literal('CHILD'),
        rt.Literal('SIBLING'),
      ),
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type NextOfKin = rt.Static<typeof nextOfKinRt>;

const responseWrapperNextOfKinRt = rt
  .Record({ value: nextOfKinRt })
  .asPartial();

type ResponseWrapperNextOfKin = rt.Static<typeof responseWrapperNextOfKinRt>;

const listResponseNextOfKinRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(nextOfKinRt),
  })
  .asPartial();

type ListResponseNextOfKin = rt.Static<typeof listResponseNextOfKinRt>;

const standardTimeRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      employee: employeeRt,
      fromDate: rt.String,
      hoursPerDay: rt.Number,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type StandardTime = rt.Static<typeof standardTimeRt>;

const responseWrapperStandardTimeRt = rt
  .Record({ value: standardTimeRt })
  .asPartial();

type ResponseWrapperStandardTime = rt.Static<
  typeof responseWrapperStandardTimeRt
>;

const listResponseStandardTimeRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(standardTimeRt),
  })
  .asPartial();

type ListResponseStandardTime = rt.Static<typeof listResponseStandardTimeRt>;

const entitlementRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      employee: employeeRt,
      entitlementId: rt.Number,
      customer: companyRt,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String, name: rt.String })
    .asPartial()
    .asReadonly(),
);

type Entitlement = rt.Static<typeof entitlementRt>;

const responseWrapperEntitlementRt = rt
  .Record({ value: entitlementRt })
  .asPartial();

type ResponseWrapperEntitlement = rt.Static<
  typeof responseWrapperEntitlementRt
>;

const listResponseEntitlementRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(entitlementRt),
  })
  .asPartial();

type ListResponseEntitlement = rt.Static<typeof listResponseEntitlementRt>;

const restrictedEntitlementChangeDTORt = rt
  .Record({ change: rt.String, customerId: rt.Number })
  .asPartial();

type RestrictedEntitlementChangeDTO = rt.Static<
  typeof restrictedEntitlementChangeDTORt
>;

const webHookWrapperRt = rt
  .Record({
    value: rt.Dictionary(rt.Unknown),
    event: rt.String,
    subscriptionId: rt.Number,
    id: rt.Number,
  })
  .asPartial();

type WebHookWrapper = rt.Static<typeof webHookWrapperRt>;

const eventInfoDTORt = rt
  .Record({
    name: rt.String,
    description: rt.String,
    payloadModel: rt.String,
    examples: rt.Array(webHookWrapperRt),
  })
  .asPartial();

type EventInfoDTO = rt.Static<typeof eventInfoDTORt>;

const responseWrapperEventInfoDTORt = rt
  .Record({ value: eventInfoDTORt })
  .asPartial();

type ResponseWrapperEventInfoDTO = rt.Static<
  typeof responseWrapperEventInfoDTORt
>;

const eventInfoDescriptionRt = rt
  .Record({ description: rt.String, payloadModel: rt.String })
  .asPartial();

type EventInfoDescription = rt.Static<typeof eventInfoDescriptionRt>;

const responseWrapperMapStringEventInfoDescriptionRt = rt
  .Record({ value: rt.Dictionary(rt.Unknown) })
  .asPartial();

type ResponseWrapperMapStringEventInfoDescription = rt.Static<
  typeof responseWrapperMapStringEventInfoDescriptionRt
>;

const notificationRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      date: rt.String,
      title: rt.String,
      message: rt.String,
      type: rt.String,
      category: rt.String,
      link: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type Notification = rt.Static<typeof notificationRt>;

const responseWrapperNotificationRt = rt
  .Record({ value: notificationRt })
  .asPartial();

type ResponseWrapperNotification = rt.Static<
  typeof responseWrapperNotificationRt
>;

const unreadCountDTORt = rt
  .Record({ count: rt.Number, readCursor: rt.Number })
  .asPartial();

type UnreadCountDTO = rt.Static<typeof unreadCountDTORt>;

const responseWrapperUnreadCountDTORt = rt
  .Record({ value: unreadCountDTORt })
  .asPartial();

type ResponseWrapperUnreadCountDTO = rt.Static<
  typeof responseWrapperUnreadCountDTORt
>;

const listResponseNotificationRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(notificationRt),
  })
  .asPartial();

type ListResponseNotification = rt.Static<typeof listResponseNotificationRt>;

const subscriptionRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      event: rt.String,
      targetUrl: rt.String,
      fields: rt.String,
      authHeaderName: rt.String,
      authHeaderValue: rt.String,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      status: rt.Union(
        rt.Literal('ACTIVE'),
        rt.Literal('DISABLED'),
        rt.Literal('DISABLED_TOO_MANY_ERRORS'),
        rt.Literal('DISABLED_RATE_LIMIT_EXCEEDED'),
        rt.Literal('DISABLED_MISUSE'),
      ),
    })
    .asPartial()
    .asReadonly(),
);

type Subscription = rt.Static<typeof subscriptionRt>;

const responseWrapperSubscriptionRt = rt
  .Record({ value: subscriptionRt })
  .asPartial();

type ResponseWrapperSubscription = rt.Static<
  typeof responseWrapperSubscriptionRt
>;

const listResponseSubscriptionRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(subscriptionRt),
  })
  .asPartial();

type ListResponseSubscription = rt.Static<typeof listResponseSubscriptionRt>;

const autoPayMessageDTORt = rt
  .Record({ messageId: rt.String, messageType: rt.String, message: rt.String })
  .asPartial();

type AutoPayMessageDTO = rt.Static<typeof autoPayMessageDTORt>;

const paymentRt = rt.Intersect(
  rt.Record({ id: rt.Number, version: rt.Number }).asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      paymentDate: rt.String,
      bookingDate: rt.String,
      valueDate: rt.String,
      amountCurrency: rt.Number,
      currency: currencyRt,
      creditorBankName: rt.String,
      creditorBankAddress: rt.String,
      creditorBankPostalCode: rt.String,
      creditorBankPostalCity: rt.String,
      status: rt.Union(
        rt.Literal('NOT_APPROVED'),
        rt.Literal('APPROVED'),
        rt.Literal('SENT_TO_AUTOPAY'),
        rt.Literal('RECEIVED_BY_BANK'),
        rt.Literal('ACCEPTED_BY_BANK'),
        rt.Literal('FAILED'),
        rt.Literal('CANCELLED'),
        rt.Literal('SUCCESS'),
      ),
      isFinalStatus: rt.Boolean,
      isForeignPayment: rt.Boolean,
      isSalary: rt.Boolean,
      description: rt.String,
      kid: rt.String,
      receiverReference: rt.String,
      sourceVoucher: voucherRt,
      postings: postingRt,
      account: accountRt,
      amountInAccountCurrency: rt.Number,
    })
    .asPartial()
    .asReadonly(),
);

type Payment = rt.Static<typeof paymentRt>;

const approveResponseDTORt = rt
  .Record({
    redirectUrl: rt.String,
    toBeApproved: rt.Array(paymentRt),
    notApproved: rt.Array(paymentRt),
  })
  .asPartial();

type ApproveResponseDTO = rt.Static<typeof approveResponseDTORt>;

const responseWrapperApproveResponseDTORt = rt
  .Record({ value: approveResponseDTORt })
  .asPartial();

type ResponseWrapperApproveResponseDTO = rt.Static<
  typeof responseWrapperApproveResponseDTORt
>;

const responseWrapperPaymentRt = rt.Record({ value: paymentRt }).asPartial();

type ResponseWrapperPayment = rt.Static<typeof responseWrapperPaymentRt>;

const listResponsePaymentRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(paymentRt),
  })
  .asPartial();

type ListResponsePayment = rt.Static<typeof listResponsePaymentRt>;

const linkMobilityReportDTORt = rt
  .Record({ refId: rt.String, operator: rt.String, resultCode: rt.Number })
  .asPartial();

type LinkMobilityReportDTO = rt.Static<typeof linkMobilityReportDTORt>;

const pG2CallbackDTORt = rt
  .Record({
    odpcustomerID: rt.Number,
    odpcompanyID: rt.Number,
    pgRequestId: rt.String,
    tenantId: rt.String,
    ODPCustomerID: rt.Number,
    ODPCompanyID: rt.Number,
    autoPayKey: rt.String,
    autoPayKeyLastGeneratedDate: rt.String,
  })
  .asPartial();

type PG2CallbackDTO = rt.Static<typeof pG2CallbackDTORt>;

const responseWrapperInventoryRt = rt
  .Record({ value: inventoryRt })
  .asPartial();

type ResponseWrapperInventory = rt.Static<typeof responseWrapperInventoryRt>;

const listResponseInventoryRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(inventoryRt),
  })
  .asPartial();

type ListResponseInventory = rt.Static<typeof listResponseInventoryRt>;

const stockRt = rt
  .Record({
    inventory: rt.String,
    openingStock: rt.Number,
    changesInPeriod: rt.Number,
    closingStock: rt.Number,
  })
  .asPartial()
  .asReadonly();

type Stock = rt.Static<typeof stockRt>;

const inventoriesRt = rt
  .Record({ product: productRt, stock: rt.Array(stockRt) })
  .asPartial()
  .asReadonly();

type Inventories = rt.Static<typeof inventoriesRt>;

const listResponseInventoriesRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(inventoriesRt),
  })
  .asPartial();

type ListResponseInventories = rt.Static<typeof listResponseInventoriesRt>;

const responseWrapperInventoryLocationRt = rt
  .Record({ value: inventoryLocationRt })
  .asPartial();

type ResponseWrapperInventoryLocation = rt.Static<
  typeof responseWrapperInventoryLocationRt
>;

const listResponseInventoryLocationRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(inventoryLocationRt),
  })
  .asPartial();

type ListResponseInventoryLocation = rt.Static<
  typeof listResponseInventoryLocationRt
>;

const stocktakingRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      date: rt.String,
      comment: rt.String,
      typeOfStocktaking: rt.Union(
        rt.Literal('ALL_PRODUCTS_WITH_INVENTORIES'),
        rt.Literal('INCLUDE_PRODUCTS'),
        rt.Literal('NO_PRODUCTS'),
      ),
      inventory: inventoryRt,
      isCompleted: rt.Boolean,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String, number: rt.Number })
    .asPartial()
    .asReadonly(),
);

type Stocktaking = rt.Static<typeof stocktakingRt>;

const responseWrapperStocktakingRt = rt
  .Record({ value: stocktakingRt })
  .asPartial();

type ResponseWrapperStocktaking = rt.Static<
  typeof responseWrapperStocktakingRt
>;

const listResponseStocktakingRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(stocktakingRt),
  })
  .asPartial();

type ListResponseStocktaking = rt.Static<typeof listResponseStocktakingRt>;

const productLineRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      stocktaking: stocktakingRt,
      product: productRt,
      count: rt.Number,
      unitCostCurrency: rt.Number,
      comment: rt.String,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      costCurrency: rt.Number,
    })
    .asPartial()
    .asReadonly(),
);

type ProductLine = rt.Static<typeof productLineRt>;

const responseWrapperProductLineRt = rt
  .Record({ value: productLineRt })
  .asPartial();

type ResponseWrapperProductLine = rt.Static<
  typeof responseWrapperProductLineRt
>;

const listResponseProductLineRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(productLineRt),
  })
  .asPartial();

type ListResponseProductLine = rt.Static<typeof listResponseProductLineRt>;

const responseWrapperInvoiceRt = rt.Record({ value: invoiceRt }).asPartial();

type ResponseWrapperInvoice = rt.Static<typeof responseWrapperInvoiceRt>;

const listResponseInvoiceRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(invoiceRt),
  })
  .asPartial();

type ListResponseInvoice = rt.Static<typeof listResponseInvoiceRt>;

const maventaEventDataDTORt = rt
  .Record({
    invoice_id: rt.String,
    invoice_number: rt.String,
    destination: rt.String,
    recipient_name: rt.String,
    recipient_bid: rt.String,
    network: rt.String,
    id: rt.String,
    profiles: rt.Array(rt.String),
    error_message: rt.String,
  })
  .asPartial();

type MaventaEventDataDTO = rt.Static<typeof maventaEventDataDTORt>;

const maventaStatusDTORt = rt
  .Record({
    event: rt.String,
    company_id: rt.String,
    event_timestamp: rt.String,
    event_data: maventaEventDataDTORt,
  })
  .asPartial();

type MaventaStatusDTO = rt.Static<typeof maventaStatusDTORt>;

const paymentTypeRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      description: rt.String,
      debitAccount: accountRt,
      creditAccount: accountRt,
      vatType: vatTypeRt,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      customer: customerRt,
      supplier: supplierRt,
    })
    .asPartial()
    .asReadonly(),
);

type PaymentType = rt.Static<typeof paymentTypeRt>;

const responseWrapperPaymentTypeRt = rt
  .Record({ value: paymentTypeRt })
  .asPartial();

type ResponseWrapperPaymentType = rt.Static<
  typeof responseWrapperPaymentTypeRt
>;

const listResponsePaymentTypeRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(paymentTypeRt),
  })
  .asPartial();

type ListResponsePaymentType = rt.Static<typeof listResponsePaymentTypeRt>;

const responseWrapperProjectInvoiceDetailsRt = rt
  .Record({ value: projectInvoiceDetailsRt })
  .asPartial();

type ResponseWrapperProjectInvoiceDetails = rt.Static<
  typeof responseWrapperProjectInvoiceDetailsRt
>;

const listResponseProjectInvoiceDetailsRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(projectInvoiceDetailsRt),
  })
  .asPartial();

type ListResponseProjectInvoiceDetails = rt.Static<
  typeof listResponseProjectInvoiceDetailsRt
>;

const ledgerAccountRt = rt
  .Record({
    account: accountRt,
    sumAmount: rt.Number,
    currency: currencyRt,
    sumAmountCurrency: rt.Number,
    openingBalance: rt.Number,
    openingBalanceCurrency: rt.Number,
    closingBalance: rt.Number,
    closingBalanceCurrency: rt.Number,
    postings: rt.Array(postingRt),
  })
  .asPartial()
  .asReadonly();

type LedgerAccount = rt.Static<typeof ledgerAccountRt>;

const listResponseLedgerAccountRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(ledgerAccountRt),
  })
  .asPartial();

type ListResponseLedgerAccount = rt.Static<typeof listResponseLedgerAccountRt>;

const supplierBalanceRt = rt.Intersect(
  rt.Record({ supplier: supplierRt }).asPartial(),
  rt
    .Record({
      balanceIn: rt.Number,
      balanceChange: rt.Number,
      balanceOut: rt.Number,
      balanceInCurrencies: rt.Array(currencyRt),
      sumAmountNegative: rt.Number,
    })
    .asPartial()
    .asReadonly(),
);

type SupplierBalance = rt.Static<typeof supplierBalanceRt>;

const listResponseSupplierBalanceRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(supplierBalanceRt),
  })
  .asPartial();

type ListResponseSupplierBalance = rt.Static<
  typeof listResponseSupplierBalanceRt
>;

const responseWrapperAccountRt = rt.Record({ value: accountRt }).asPartial();

type ResponseWrapperAccount = rt.Static<typeof responseWrapperAccountRt>;

const listResponseAccountRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(accountRt),
  })
  .asPartial();

type ListResponseAccount = rt.Static<typeof listResponseAccountRt>;

const responseWrapperAccountingPeriodRt = rt
  .Record({ value: accountingPeriodRt })
  .asPartial();

type ResponseWrapperAccountingPeriod = rt.Static<
  typeof responseWrapperAccountingPeriodRt
>;

const listResponseAccountingPeriodRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(accountingPeriodRt),
  })
  .asPartial();

type ListResponseAccountingPeriod = rt.Static<
  typeof listResponseAccountingPeriodRt
>;

const annualAccountRt = rt.Intersect(
  rt.Record({ id: rt.Number, version: rt.Number }).asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      year: rt.Number,
      start: rt.String,
      end: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

type AnnualAccount = rt.Static<typeof annualAccountRt>;

const responseWrapperAnnualAccountRt = rt
  .Record({ value: annualAccountRt })
  .asPartial();

type ResponseWrapperAnnualAccount = rt.Static<
  typeof responseWrapperAnnualAccountRt
>;

const listResponseAnnualAccountRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(annualAccountRt),
  })
  .asPartial();

type ListResponseAnnualAccount = rt.Static<typeof listResponseAnnualAccountRt>;

const responseWrapperCloseGroupRt = rt
  .Record({ value: closeGroupRt })
  .asPartial();

type ResponseWrapperCloseGroup = rt.Static<typeof responseWrapperCloseGroupRt>;

const listResponseCloseGroupRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(closeGroupRt),
  })
  .asPartial();

type ListResponseCloseGroup = rt.Static<typeof listResponseCloseGroupRt>;

const paymentTypeOutRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      description: rt.String,
      isBruttoWageDeduction: rt.Boolean,
      creditAccount: accountRt,
      showIncomingInvoice: rt.Boolean,
      showWagePayment: rt.Boolean,
      showVatReturns: rt.Boolean,
      showWagePeriodTransaction: rt.Boolean,
      requiresSeparateVoucher: rt.Boolean,
      sequence: rt.Number,
      isInactive: rt.Boolean,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type PaymentTypeOut = rt.Static<typeof paymentTypeOutRt>;

const responseWrapperPaymentTypeOutRt = rt
  .Record({ value: paymentTypeOutRt })
  .asPartial();

type ResponseWrapperPaymentTypeOut = rt.Static<
  typeof responseWrapperPaymentTypeOutRt
>;

const listResponsePaymentTypeOutRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(paymentTypeOutRt),
  })
  .asPartial();

type ListResponsePaymentTypeOut = rt.Static<
  typeof listResponsePaymentTypeOutRt
>;

const listResponsePostingRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(postingRt),
  })
  .asPartial();

type ListResponsePosting = rt.Static<typeof listResponsePostingRt>;

const responseWrapperPostingRt = rt.Record({ value: postingRt }).asPartial();

type ResponseWrapperPosting = rt.Static<typeof responseWrapperPostingRt>;

const responseWrapperVatTypeRt = rt.Record({ value: vatTypeRt }).asPartial();

type ResponseWrapperVatType = rt.Static<typeof responseWrapperVatTypeRt>;

const listResponseVatTypeRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(vatTypeRt),
  })
  .asPartial();

type ListResponseVatType = rt.Static<typeof listResponseVatTypeRt>;

const responseWrapperVoucherRt = rt.Record({ value: voucherRt }).asPartial();

type ResponseWrapperVoucher = rt.Static<typeof responseWrapperVoucherRt>;

const listResponseVoucherRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(voucherRt),
  })
  .asPartial();

type ListResponseVoucher = rt.Static<typeof listResponseVoucherRt>;

const deleteRt = rt
  .Record({ available: rt.Boolean, reasons: rt.Array(rt.String) })
  .asPartial()
  .asReadonly();

type Delete = rt.Static<typeof deleteRt>;

const voucherOptionsRt = rt
  .Record({ delete: deleteRt })
  .asPartial()
  .asReadonly();

type VoucherOptions = rt.Static<typeof voucherOptionsRt>;

const responseWrapperVoucherOptionsRt = rt
  .Record({ value: voucherOptionsRt })
  .asPartial();

type ResponseWrapperVoucherOptions = rt.Static<
  typeof responseWrapperVoucherOptionsRt
>;

const voucherSearchResponseRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(voucherRt),
    totalNumberOfPostings: rt.Number,
  })
  .asPartial();

type VoucherSearchResponse = rt.Static<typeof voucherSearchResponseRt>;

const responseWrapperVoucherTypeRt = rt
  .Record({ value: voucherTypeRt })
  .asPartial();

type ResponseWrapperVoucherType = rt.Static<
  typeof responseWrapperVoucherTypeRt
>;

const listResponseVoucherTypeRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(voucherTypeRt),
  })
  .asPartial();

type ListResponseVoucherType = rt.Static<typeof listResponseVoucherTypeRt>;

const searchCompletionDTORt = rt
  .Record({
    name: rt.String,
    alternateName: rt.String,
    address: rt.String,
    postalCode: rt.String,
    postalArea: rt.String,
    latitude: rt.Number,
    longitude: rt.Number,
    score: rt.Number,
    sources: rt.Array(
      rt.Union(
        rt.Literal('SEARCH1881'),
        rt.Literal('TRIPLETEX'),
        rt.Literal('NICKNAME'),
        rt.Literal('EMPLOYEE'),
        rt.Literal('CONTACT'),
        rt.Literal('ACTIVITY'),
        rt.Literal('PROJECT'),
        rt.Literal('ORDER'),
        rt.Literal('OFFER'),
        rt.Literal('CUSTOMER'),
        rt.Literal('COMPANY'),
        rt.Literal('CONTROLSCHEMA'),
        rt.Literal('HOUR'),
        rt.Literal('TRAVELEXPENSE'),
      ),
    ),
    id: rt.String,
    category: rt.String,
  })
  .asPartial();

type SearchCompletionDTO = rt.Static<typeof searchCompletionDTORt>;

const listResponseSearchCompletionDTORt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(searchCompletionDTORt),
  })
  .asPartial();

type ListResponseSearchCompletionDTO = rt.Static<
  typeof listResponseSearchCompletionDTORt
>;

const personAutoCompleteDTORt = rt
  .Record({
    name: rt.String,
    alternateName: rt.String,
    address: rt.String,
    postalCode: rt.String,
    postalArea: rt.String,
    latitude: rt.Number,
    longitude: rt.Number,
    score: rt.Number,
    sources: rt.Array(
      rt.Union(
        rt.Literal('SEARCH1881'),
        rt.Literal('TRIPLETEX'),
        rt.Literal('NICKNAME'),
        rt.Literal('EMPLOYEE'),
        rt.Literal('CONTACT'),
        rt.Literal('ACTIVITY'),
        rt.Literal('PROJECT'),
        rt.Literal('ORDER'),
        rt.Literal('OFFER'),
        rt.Literal('CUSTOMER'),
        rt.Literal('COMPANY'),
        rt.Literal('CONTROLSCHEMA'),
        rt.Literal('HOUR'),
        rt.Literal('TRAVELEXPENSE'),
      ),
    ),
    firstname: rt.String,
    lastname: rt.String,
    phoneNumber: rt.String,
    phoneNumberMobile: rt.String,
    email: rt.String,
    url: rt.String,
    countryId: rt.Number,
    reserved: rt.Boolean,
  })
  .asPartial();

type PersonAutoCompleteDTO = rt.Static<typeof personAutoCompleteDTORt>;

const listResponsePersonAutoCompleteDTORt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(personAutoCompleteDTORt),
  })
  .asPartial();

type ListResponsePersonAutoCompleteDTO = rt.Static<
  typeof listResponsePersonAutoCompleteDTORt
>;

const companyAutoCompleteDTORt = rt
  .Record({
    name: rt.String,
    alternateName: rt.String,
    address: rt.String,
    postalCode: rt.String,
    postalArea: rt.String,
    latitude: rt.Number,
    longitude: rt.Number,
    score: rt.Number,
    sources: rt.Array(
      rt.Union(
        rt.Literal('SEARCH1881'),
        rt.Literal('TRIPLETEX'),
        rt.Literal('NICKNAME'),
        rt.Literal('EMPLOYEE'),
        rt.Literal('CONTACT'),
        rt.Literal('ACTIVITY'),
        rt.Literal('PROJECT'),
        rt.Literal('ORDER'),
        rt.Literal('OFFER'),
        rt.Literal('CUSTOMER'),
        rt.Literal('COMPANY'),
        rt.Literal('CONTROLSCHEMA'),
        rt.Literal('HOUR'),
        rt.Literal('TRAVELEXPENSE'),
      ),
    ),
    companyCode: rt.String,
    companyType: rt.Number,
    phoneNumber: rt.String,
    phoneNumberMobile: rt.String,
    email: rt.String,
    url: rt.String,
    countryId: rt.Number,
  })
  .asPartial();

type CompanyAutoCompleteDTO = rt.Static<typeof companyAutoCompleteDTORt>;

const listResponseCompanyAutoCompleteDTORt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(companyAutoCompleteDTORt),
  })
  .asPartial();

type ListResponseCompanyAutoCompleteDTO = rt.Static<
  typeof listResponseCompanyAutoCompleteDTORt
>;

const tripDTORt = rt
  .Record({
    distance: rt.Number,
    travelTimeInMinutes: rt.Number,
    sumTollNOK: rt.Number,
  })
  .asPartial();

type TripDTO = rt.Static<typeof tripDTORt>;

const responseWrapperTripDTORt = rt.Record({ value: tripDTORt }).asPartial();

type ResponseWrapperTripDTO = rt.Static<typeof responseWrapperTripDTORt>;

const appSpecificRt = rt
  .Record({
    hourRegistrationEnabled: rt.Boolean,
    projectEnabled: rt.Boolean,
    departmentEnabled: rt.Boolean,
    userIsAllowedToRegisterHours: rt.Boolean,
    payrollAccountingEnabled: rt.Boolean,
    userIsAuthWageMenu: rt.Boolean,
    userIsAuthMySalary: rt.Boolean,
    electronicVouchersEnabled: rt.Boolean,
    travelExpenseEnabled: rt.Boolean,
    documentArchiveEnabled: rt.Boolean,
    archiveReceptionEnabled: rt.Boolean,
    userIsPayslipOnly: rt.Boolean,
    travelExpenseRatesEnabled: rt.Boolean,
    taxFreeMileageRatesEnabled: rt.Boolean,
    approveTravelExpenseEnabled: rt.Boolean,
    userIsAuthProjectInfo: rt.Boolean,
    userIsAuthTravelAndExpenseApprove: rt.Boolean,
    userIsAuthEmployeeInfo: rt.Boolean,
    userIsAuthVoucherApprove: rt.Boolean,
    userIsAuthRemitApprove: rt.Boolean,
    userIsAuthInvoicing: rt.Boolean,
    userIsAuthCreateOrder: rt.Boolean,
    vatOnForCompany: rt.Boolean,
    taxFreeDietRatesEnabled: rt.Boolean,
    travelDietIgnorePostingEnabled: rt.Boolean,
    employeeEnabled: rt.Boolean,
    hourBalanceEnabledForEmployee: rt.Boolean,
    vacationBalanceEnabledForEmployee: rt.Boolean,
    userIsAuthCreateCustomer: rt.Boolean,
  })
  .asPartial();

type AppSpecific = rt.Static<typeof appSpecificRt>;

const responseWrapperAppSpecificRt = rt
  .Record({ value: appSpecificRt })
  .asPartial();

type ResponseWrapperAppSpecific = rt.Static<
  typeof responseWrapperAppSpecificRt
>;

const listResponseMunicipalityRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(municipalityRt),
  })
  .asPartial();

type ListResponseMunicipality = rt.Static<typeof listResponseMunicipalityRt>;

const pageOptionsRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      key: rt.String,
      type: rt.Union(
        rt.Literal('IncomingInvoiceViewOptions'),
        rt.Literal('PurchaseOrderOverviewOptions'),
      ),
      level: rt.Union(rt.Literal('Employee'), rt.Literal('Company')),
      data: rt.Dictionary(rt.Unknown),
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type PageOptions = rt.Static<typeof pageOptionsRt>;

const responseWrapperPageOptionsRt = rt
  .Record({ value: pageOptionsRt })
  .asPartial();

type ResponseWrapperPageOptions = rt.Static<
  typeof responseWrapperPageOptionsRt
>;

const responseWrapperOrderRt = rt.Record({ value: orderRt }).asPartial();

type ResponseWrapperOrder = rt.Static<typeof responseWrapperOrderRt>;

const listResponseOrderRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(orderRt),
  })
  .asPartial();

type ListResponseOrder = rt.Static<typeof listResponseOrderRt>;

const orderOfferRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      number: rt.String,
      department: departmentRt,
      offerDate: rt.String,
      customer: customerRt,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type OrderOffer = rt.Static<typeof orderOfferRt>;

const responseWrapperOrderOfferRt = rt
  .Record({ value: orderOfferRt })
  .asPartial();

type ResponseWrapperOrderOffer = rt.Static<typeof responseWrapperOrderOfferRt>;

const listResponseOrderOfferRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(orderOfferRt),
  })
  .asPartial();

type ListResponseOrderOffer = rt.Static<typeof listResponseOrderOfferRt>;

const responseWrapperOrderGroupRt = rt
  .Record({ value: orderGroupRt })
  .asPartial();

type ResponseWrapperOrderGroup = rt.Static<typeof responseWrapperOrderGroupRt>;

const listResponseOrderGroupRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(orderGroupRt),
  })
  .asPartial();

type ListResponseOrderGroup = rt.Static<typeof listResponseOrderGroupRt>;

const responseWrapperOrderLineRt = rt
  .Record({ value: orderLineRt })
  .asPartial();

type ResponseWrapperOrderLine = rt.Static<typeof responseWrapperOrderLineRt>;

const listResponseOrderLineRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(orderLineRt),
  })
  .asPartial();

type ListResponseOrderLine = rt.Static<typeof listResponseOrderLineRt>;

const externalProductRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      name: rt.String,
      elNumber: rt.String,
      nrfNumber: rt.String,
      priceExcludingVatCurrency: rt.Number,
      priceIncludingVatCurrency: rt.Number,
      isInactive: rt.Boolean,
      productUnit: productUnitRt,
      isStockItem: rt.Boolean,
      vatType: vatTypeRt,
      currency: currencyRt,
      department: departmentRt,
      account: accountRt,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      costExcludingVatCurrency: rt.Number,
      discountPrice: rt.Number,
    })
    .asPartial()
    .asReadonly(),
);

type ExternalProduct = rt.Static<typeof externalProductRt>;

const responseWrapperExternalProductRt = rt
  .Record({ value: externalProductRt })
  .asPartial();

type ResponseWrapperExternalProduct = rt.Static<
  typeof responseWrapperExternalProductRt
>;

const listResponseExternalProductRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(externalProductRt),
  })
  .asPartial();

type ListResponseExternalProduct = rt.Static<
  typeof listResponseExternalProductRt
>;

const responseWrapperProductRt = rt.Record({ value: productRt }).asPartial();

type ResponseWrapperProduct = rt.Static<typeof responseWrapperProductRt>;

const listResponseProductRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(productRt),
  })
  .asPartial();

type ListResponseProduct = rt.Static<typeof listResponseProductRt>;

const productNewsRt = rt
  .Record({
    title: rt.String,
    publish_date: rt.String,
    excerpt: rt.String,
    permalink: rt.String,
  })
  .asPartial();

type ProductNews = rt.Static<typeof productNewsRt>;

const listResponseProductNewsRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(productNewsRt),
  })
  .asPartial();

type ListResponseProductNews = rt.Static<typeof listResponseProductNewsRt>;

const productInventoryLocationRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      product: productRt,
      inventory: inventoryRt,
      inventoryLocation: inventoryLocationRt,
      isMainLocation: rt.Boolean,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      stockOfGoods: rt.Number,
    })
    .asPartial()
    .asReadonly(),
);

type ProductInventoryLocation = rt.Static<typeof productInventoryLocationRt>;

const responseWrapperProductInventoryLocationRt = rt
  .Record({ value: productInventoryLocationRt })
  .asPartial();

type ResponseWrapperProductInventoryLocation = rt.Static<
  typeof responseWrapperProductInventoryLocationRt
>;

const listResponseProductInventoryLocationRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(productInventoryLocationRt),
  })
  .asPartial();

type ListResponseProductInventoryLocation = rt.Static<
  typeof listResponseProductInventoryLocationRt
>;

const logisticsSettingsRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      hasWarehouseLocation: rt.Boolean,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type LogisticsSettings = rt.Static<typeof logisticsSettingsRt>;

const responseWrapperLogisticsSettingsRt = rt
  .Record({ value: logisticsSettingsRt })
  .asPartial();

type ResponseWrapperLogisticsSettings = rt.Static<
  typeof responseWrapperLogisticsSettingsRt
>;

type ProductGroup = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  name?: string;
  parentGroup?: ProductGroup;
  readonly isDeletable?: boolean;
};

const productGroupRt: rt.Runtype<ProductGroup> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        name: rt.String,
        parentGroup: productGroupRt,
      })
      .asPartial(),
    rt
      .Record({
        changes: rt.Array(changeRt),
        url: rt.String,
        isDeletable: rt.Boolean,
      })
      .asPartial()
      .asReadonly(),
  ),
);

const responseWrapperProductGroupRt = rt
  .Record({ value: productGroupRt })
  .asPartial();

type ResponseWrapperProductGroup = rt.Static<
  typeof responseWrapperProductGroupRt
>;

const listResponseProductGroupRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(productGroupRt),
  })
  .asPartial();

type ListResponseProductGroup = rt.Static<typeof listResponseProductGroupRt>;

const productGroupRelationRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      product: productRt,
      productGroup: productGroupRt,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type ProductGroupRelation = rt.Static<typeof productGroupRelationRt>;

const responseWrapperProductGroupRelationRt = rt
  .Record({ value: productGroupRelationRt })
  .asPartial();

type ResponseWrapperProductGroupRelation = rt.Static<
  typeof responseWrapperProductGroupRelationRt
>;

const listResponseProductGroupRelationRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(productGroupRelationRt),
  })
  .asPartial();

type ListResponseProductGroupRelation = rt.Static<
  typeof listResponseProductGroupRelationRt
>;

const productPriceRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      product: productRt,
      fromDate: rt.String,
      toDate: rt.String,
      purchasePrice: tlxNumberRt,
      costPrice: tlxNumberRt,
      salesPriceExcludingVat: tlxNumberRt,
      vatType: vatTypeRt,
      salesPriceIncludingVat: tlxNumberRt,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type ProductPrice = rt.Static<typeof productPriceRt>;

const listResponseProductPriceRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(productPriceRt),
  })
  .asPartial();

type ListResponseProductPrice = rt.Static<typeof listResponseProductPriceRt>;

const responseWrapperProductUnitRt = rt
  .Record({ value: productUnitRt })
  .asPartial();

type ResponseWrapperProductUnit = rt.Static<
  typeof responseWrapperProductUnitRt
>;

const listResponseProductUnitRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(productUnitRt),
  })
  .asPartial();

type ListResponseProductUnit = rt.Static<typeof listResponseProductUnitRt>;

const productUnitMasterRt = rt.Intersect(
  rt.Record({ id: rt.Number, version: rt.Number }).asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      name: rt.String,
      nameShort: rt.String,
      commonCode: rt.String,
      peppolName: rt.String,
      peppolSymbol: rt.String,
      isInactive: rt.Boolean,
    })
    .asPartial()
    .asReadonly(),
);

type ProductUnitMaster = rt.Static<typeof productUnitMasterRt>;

const responseWrapperProductUnitMasterRt = rt
  .Record({ value: productUnitMasterRt })
  .asPartial();

type ResponseWrapperProductUnitMaster = rt.Static<
  typeof responseWrapperProductUnitMasterRt
>;

const listResponseProductUnitMasterRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(productUnitMasterRt),
  })
  .asPartial();

type ListResponseProductUnitMaster = rt.Static<
  typeof listResponseProductUnitMasterRt
>;

const responseWrapperProjectRt = rt.Record({ value: projectRt }).asPartial();

type ResponseWrapperProject = rt.Static<typeof responseWrapperProjectRt>;

const listResponseProjectRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(projectRt),
  })
  .asPartial();

type ListResponseProject = rt.Static<typeof listResponseProjectRt>;

const responseWrapperLongRt = rt.Record({ value: rt.Number }).asPartial();

type ResponseWrapperLong = rt.Static<typeof responseWrapperLongRt>;

const responseWrapperBooleanRt = rt.Record({ value: rt.Boolean }).asPartial();

type ResponseWrapperBoolean = rt.Static<typeof responseWrapperBooleanRt>;

const responseWrapperProjectCategoryRt = rt
  .Record({ value: projectCategoryRt })
  .asPartial();

type ResponseWrapperProjectCategory = rt.Static<
  typeof responseWrapperProjectCategoryRt
>;

const listResponseProjectCategoryRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(projectCategoryRt),
  })
  .asPartial();

type ListResponseProjectCategory = rt.Static<
  typeof listResponseProjectCategoryRt
>;

const responseWrapperProjectOrderLineRt = rt
  .Record({ value: projectOrderLineRt })
  .asPartial();

type ResponseWrapperProjectOrderLine = rt.Static<
  typeof responseWrapperProjectOrderLineRt
>;

const listResponseProjectOrderLineRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(projectOrderLineRt),
  })
  .asPartial();

type ListResponseProjectOrderLine = rt.Static<
  typeof listResponseProjectOrderLineRt
>;

const responseWrapperProjectParticipantRt = rt
  .Record({ value: projectParticipantRt })
  .asPartial();

type ResponseWrapperProjectParticipant = rt.Static<
  typeof responseWrapperProjectParticipantRt
>;

const listResponseProjectParticipantRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(projectParticipantRt),
  })
  .asPartial();

type ListResponseProjectParticipant = rt.Static<
  typeof listResponseProjectParticipantRt
>;

const projectPeriodInvoicingReserveRt = rt
  .Record({
    invoiceFeeReserveCurrency: rt.Number,
    periodOrderLinesIncomeCurrency: rt.Number,
    invoiceExtracostsReserveCurrency: rt.Number,
    invoiceAkontoReserveAmountCurrency: rt.Number,
    invoiceReserveTotalAmountCurrency: rt.Number,
  })
  .asPartial()
  .asReadonly();

type ProjectPeriodInvoicingReserve = rt.Static<
  typeof projectPeriodInvoicingReserveRt
>;

const responseWrapperProjectPeriodInvoicingReserveRt = rt
  .Record({ value: projectPeriodInvoicingReserveRt })
  .asPartial();

type ResponseWrapperProjectPeriodInvoicingReserve = rt.Static<
  typeof responseWrapperProjectPeriodInvoicingReserveRt
>;

const projectPeriodInvoicedRt = rt
  .Record({
    sumAmountPaid: rt.Number,
    sumAmountOutstanding: rt.Number,
    sumAmountDue: rt.Number,
    sumAmountDueOutstanding: rt.Number,
    sumAmount: rt.Number,
  })
  .asPartial()
  .asReadonly();

type ProjectPeriodInvoiced = rt.Static<typeof projectPeriodInvoicedRt>;

const responseWrapperProjectPeriodInvoicedRt = rt
  .Record({ value: projectPeriodInvoicedRt })
  .asPartial();

type ResponseWrapperProjectPeriodInvoiced = rt.Static<
  typeof responseWrapperProjectPeriodInvoicedRt
>;

const projectPeriodOverallStatusRt = rt
  .Record({ income: rt.Number, costs: rt.Number })
  .asPartial()
  .asReadonly();

type ProjectPeriodOverallStatus = rt.Static<
  typeof projectPeriodOverallStatusRt
>;

const responseWrapperProjectPeriodOverallStatusRt = rt
  .Record({ value: projectPeriodOverallStatusRt })
  .asPartial();

type ResponseWrapperProjectPeriodOverallStatus = rt.Static<
  typeof responseWrapperProjectPeriodOverallStatusRt
>;

const projectPeriodMonthlyStatusRt = rt
  .Record({
    income: rt.Number,
    costs: rt.Number,
    dateFrom: rt.String,
    dateTo: rt.String,
  })
  .asPartial()
  .asReadonly();

type ProjectPeriodMonthlyStatus = rt.Static<
  typeof projectPeriodMonthlyStatusRt
>;

const listResponseProjectPeriodMonthlyStatusRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(projectPeriodMonthlyStatusRt),
  })
  .asPartial();

type ListResponseProjectPeriodMonthlyStatus = rt.Static<
  typeof listResponseProjectPeriodMonthlyStatusRt
>;

const projectPeriodHourlyReportRt = rt
  .Record({
    chargeableHours: rt.Number,
    nonChargeableHours: rt.Number,
    approvedButUnchargedHours: rt.Number,
    nonApprovedHours: rt.Number,
    registeredHours: rt.Number,
  })
  .asPartial()
  .asReadonly();

type ProjectPeriodHourlyReport = rt.Static<typeof projectPeriodHourlyReportRt>;

const responseWrapperProjectPeriodHourlyReportRt = rt
  .Record({ value: projectPeriodHourlyReportRt })
  .asPartial();

type ResponseWrapperProjectPeriodHourlyReport = rt.Static<
  typeof responseWrapperProjectPeriodHourlyReportRt
>;

const responseWrapperProjectActivityRt = rt
  .Record({ value: projectActivityRt })
  .asPartial();

type ResponseWrapperProjectActivity = rt.Static<
  typeof responseWrapperProjectActivityRt
>;

const projectControlFormRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      title: rt.String,
      comment: rt.String,
      completed: rt.Boolean,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      signatureRequired: rt.Boolean,
      signed: rt.Boolean,
      controlForm: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

type ProjectControlForm = rt.Static<typeof projectControlFormRt>;

const responseWrapperProjectControlFormRt = rt
  .Record({ value: projectControlFormRt })
  .asPartial();

type ResponseWrapperProjectControlForm = rt.Static<
  typeof responseWrapperProjectControlFormRt
>;

const listResponseProjectControlFormRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(projectControlFormRt),
  })
  .asPartial();

type ListResponseProjectControlForm = rt.Static<
  typeof listResponseProjectControlFormRt
>;

const projectControlFormTypeRt = rt.Intersect(
  rt.Record({ id: rt.Number, version: rt.Number, name: rt.String }).asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type ProjectControlFormType = rt.Static<typeof projectControlFormTypeRt>;

const responseWrapperProjectControlFormTypeRt = rt
  .Record({ value: projectControlFormTypeRt })
  .asPartial();

type ResponseWrapperProjectControlFormType = rt.Static<
  typeof responseWrapperProjectControlFormTypeRt
>;

const listResponseProjectControlFormTypeRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(projectControlFormTypeRt),
  })
  .asPartial();

type ListResponseProjectControlFormType = rt.Static<
  typeof listResponseProjectControlFormTypeRt
>;

const responseWrapperProjectHourlyRateRt = rt
  .Record({ value: projectHourlyRateRt })
  .asPartial();

type ResponseWrapperProjectHourlyRate = rt.Static<
  typeof responseWrapperProjectHourlyRateRt
>;

const listResponseProjectHourlyRateRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(projectHourlyRateRt),
  })
  .asPartial();

type ListResponseProjectHourlyRate = rt.Static<
  typeof listResponseProjectHourlyRateRt
>;

const responseWrapperProjectSpecificRateRt = rt
  .Record({ value: projectSpecificRateRt })
  .asPartial();

type ResponseWrapperProjectSpecificRate = rt.Static<
  typeof responseWrapperProjectSpecificRateRt
>;

const listResponseProjectSpecificRateRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(projectSpecificRateRt),
  })
  .asPartial();

type ListResponseProjectSpecificRate = rt.Static<
  typeof listResponseProjectSpecificRateRt
>;

const projectSettingsRt = rt
  .Record({
    approveHourLists: rt.Boolean,
    approveInvoices: rt.Boolean,
    markReadyForInvoicing: rt.Boolean,
    historicalInformation: rt.Boolean,
    projectForecast: rt.Boolean,
    budgetOnSubcontracts: rt.Boolean,
    projectCategories: rt.Boolean,
    referenceFee: rt.Boolean,
    sortOrderProjects: rt.Union(
      rt.Literal('SORT_ORDER_NAME_AND_NUMBER'),
      rt.Literal('SORT_ORDER_NAME'),
    ),
    hideInactiveProjects: rt.Boolean,
    autoCloseInvoicedProjects: rt.Boolean,
    mustApproveRegisteredHours: rt.Boolean,
    showProjectOrderLinesToAllProjectParticipants: rt.Boolean,
    hourCostPercentage: rt.Boolean,
    fixedPriceProjectsFeeCalcMethod: rt.Union(
      rt.Literal('FIXED_PRICE_PROJECTS_CALC_METHOD_INVOICED_FEE'),
      rt.Literal('FIXED_PRICE_PROJECTS_CALC_METHOD_PERCENT_COMPLETED'),
    ),
    fixedPriceProjectsInvoiceByProgress: rt.Boolean,
    projectBudgetReferenceFee: rt.Boolean,
    allowMultipleProjectInvoiceVat: rt.Boolean,
    standardReinvoicing: rt.Boolean,
    isCurrentMonthDefaultPeriod: rt.Boolean,
    autoGenerateProjectNumber: rt.Boolean,
    autoGenerateStartingNumber: rt.Number,
    projectNameScheme: rt.Union(
      rt.Literal('NAME_STANDARD'),
      rt.Literal('NAME_INCL_CUSTOMER_NAME'),
      rt.Literal('NAME_INCL_PARENT_NAME'),
      rt.Literal('NAME_INCL_PARENT_NUMBER'),
      rt.Literal('NAME_INCL_PARENT_NAME_AND_NUMBER'),
    ),
    projectTypeOfContract: rt.Union(
      rt.Literal('PROJECT_FIXED_PRICE'),
      rt.Literal('PROJECT_HOUR_RATES'),
    ),
    projectOrderLinesSortOrder: rt.Union(
      rt.Literal('SORT_ORDER_ID'),
      rt.Literal('SORT_ORDER_DATE'),
      rt.Literal('SORT_ORDER_PRODUCT'),
      rt.Literal('SORT_ORDER_CUSTOM'),
    ),
    projectHourlyRateModel: rt.Union(
      rt.Literal('TYPE_PREDEFINED_HOURLY_RATES'),
      rt.Literal('TYPE_PROJECT_SPECIFIC_HOURLY_RATES'),
      rt.Literal('TYPE_FIXED_HOURLY_RATE'),
    ),
    onlyProjectMembersCanRegisterInfo: rt.Boolean,
    onlyProjectActivitiesTimesheetRegistration: rt.Boolean,
    hourlyRateProjectsWriteUpDown: rt.Boolean,
    defaultProjectContractComment: rt.String,
    defaultProjectInvoicingComment: rt.String,
    resourcePlanning: rt.Boolean,
    resourceGroups: rt.Boolean,
    holidayPlan: rt.Boolean,
    resourcePlanPeriod: rt.Union(
      rt.Literal('PERIOD_MONTH'),
      rt.Literal('PERIOD_WEEK'),
      rt.Literal('PERIOD_DAY'),
    ),
    controlFormsRequiredForInvoicing: rt.Array(projectControlFormTypeRt),
    controlFormsRequiredForHourTracking: rt.Array(projectControlFormTypeRt),
    useLoggedInUserEmailOnProjectBudget: rt.Boolean,
    emailOnProjectBudget: rt.String,
    useLoggedInUserEmailOnProjectContract: rt.Boolean,
    emailOnProjectContract: rt.String,
    useLoggedInUserEmailOnDocuments: rt.Boolean,
    emailOnDocuments: rt.String,
  })
  .asPartial();

type ProjectSettings = rt.Static<typeof projectSettingsRt>;

const responseWrapperProjectSettingsRt = rt
  .Record({ value: projectSettingsRt })
  .asPartial();

type ResponseWrapperProjectSettings = rt.Static<
  typeof responseWrapperProjectSettingsRt
>;

const taskRt = rt.Intersect(
  rt.Record({ id: rt.Number, version: rt.Number }).asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      name: rt.String,
      status: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

type Task = rt.Static<typeof taskRt>;

const listResponseTaskRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(taskRt),
  })
  .asPartial();

type ListResponseTask = rt.Static<typeof listResponseTaskRt>;

const projectSpecificRateTemplateRt = rt
  .Record({
    hourlyRate: rt.Number,
    hourlyCostPercentage: rt.Number,
    employee: employeeRt,
    activity: activityRt,
  })
  .asPartial();

type ProjectSpecificRateTemplate = rt.Static<
  typeof projectSpecificRateTemplateRt
>;

const projectHourlyRateTemplateRt = rt
  .Record({
    startDate: rt.String,
    showInProjectOrder: rt.Boolean,
    hourlyRateModel: rt.Union(
      rt.Literal('TYPE_PREDEFINED_HOURLY_RATES'),
      rt.Literal('TYPE_PROJECT_SPECIFIC_HOURLY_RATES'),
      rt.Literal('TYPE_FIXED_HOURLY_RATE'),
    ),
    projectSpecificRates: rt.Array(projectSpecificRateTemplateRt),
    fixedRate: rt.Number,
  })
  .asPartial();

type ProjectHourlyRateTemplate = rt.Static<typeof projectHourlyRateTemplateRt>;

const projectTemplateRt = rt
  .Record({
    name: rt.String,
    startDate: rt.String,
    endDate: rt.String,
    isInternal: rt.Boolean,
    number: rt.String,
    displayNameFormat: rt.Union(
      rt.Literal('NAME_STANDARD'),
      rt.Literal('NAME_INCL_CUSTOMER_NAME'),
      rt.Literal('NAME_INCL_PARENT_NAME'),
      rt.Literal('NAME_INCL_PARENT_NUMBER'),
      rt.Literal('NAME_INCL_PARENT_NAME_AND_NUMBER'),
    ),
    projectManager: employeeRt,
    department: departmentRt,
    mainProject: projectRt,
    projectCategory: projectCategoryRt,
    reference: rt.String,
    externalAccountsNumber: rt.String,
    description: rt.String,
    invoiceComment: rt.String,
    attention: contactRt,
    contact: contactRt,
    customer: customerRt,
    deliveryAddress: deliveryAddressRt,
    vatType: vatTypeRt,
    currency: currencyRt,
    markUpOrderLines: rt.Number,
    markUpFeesEarned: rt.Number,
    isFixedPrice: rt.Boolean,
    fixedprice: rt.Number,
    isPriceCeiling: rt.Boolean,
    priceCeilingAmount: rt.Number,
    generalProjectActivitiesPerProjectOnly: rt.Boolean,
    forParticipantsOnly: rt.Boolean,
    projectHourlyRates: rt.Array(projectHourlyRateTemplateRt),
  })
  .asPartial();

type ProjectTemplate = rt.Static<typeof projectTemplateRt>;

const responseWrapperProjectTemplateRt = rt
  .Record({ value: projectTemplateRt })
  .asPartial();

type ResponseWrapperProjectTemplate = rt.Static<
  typeof responseWrapperProjectTemplateRt
>;

const prospectRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      name: rt.String,
      description: rt.String,
      createdDate: rt.String,
      customer: customerRt,
      salesEmployee: employeeRt,
      isClosed: rt.Boolean,
      closedReason: rt.Number,
      closedDate: rt.String,
      competitor: rt.String,
      prospectType: rt.Number,
      project: projectRt,
      projectOffer: projectRt,
      finalIncomeDate: rt.String,
      finalInitialValue: rt.Number,
      finalMonthlyValue: rt.Number,
      finalAdditionalServicesValue: rt.Number,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      totalValue: rt.Number,
    })
    .asPartial()
    .asReadonly(),
);

type Prospect = rt.Static<typeof prospectRt>;

const responseWrapperProspectRt = rt.Record({ value: prospectRt }).asPartial();

type ResponseWrapperProspect = rt.Static<typeof responseWrapperProspectRt>;

const listResponseProspectRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(prospectRt),
  })
  .asPartial();

type ListResponseProspect = rt.Static<typeof listResponseProspectRt>;

const transportTypeRt = rt.Intersect(
  rt.Record({ id: rt.Number, version: rt.Number }).asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      nameKey: rt.String,
      code: rt.String,
      isPickUp: rt.Boolean,
    })
    .asPartial()
    .asReadonly(),
);

type TransportType = rt.Static<typeof transportTypeRt>;

const pickupPointRt = rt.Intersect(
  rt.Record({ id: rt.Number, version: rt.Number }).asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      code: rt.String,
      name: rt.String,
      transportType: transportTypeRt,
    })
    .asPartial()
    .asReadonly(),
);

type PickupPoint = rt.Static<typeof pickupPointRt>;

const responseWrapperPickupPointRt = rt
  .Record({ value: pickupPointRt })
  .asPartial();

type ResponseWrapperPickupPoint = rt.Static<
  typeof responseWrapperPickupPointRt
>;

const listResponsePickupPointRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(pickupPointRt),
  })
  .asPartial();

type ListResponsePickupPoint = rt.Static<typeof listResponsePickupPointRt>;

type PurchaseOrderline = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  purchaseOrder?: PurchaseOrder;
  product?: Product;
  description?: string;
  count?: number;
  unitCostCurrency?: number;
  unitPriceExcludingVatCurrency?: number;
  readonly currency?: Currency;
  discount?: number;
  readonly amountExcludingVatCurrency?: number;
  readonly amountIncludingVatCurrency?: number;
};

const purchaseOrderlineRt: rt.Runtype<PurchaseOrderline> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        purchaseOrder: purchaseOrderRt,
        product: productRt,
        description: rt.String,
        count: rt.Number,
        unitCostCurrency: rt.Number,
        unitPriceExcludingVatCurrency: rt.Number,
        discount: rt.Number,
      })
      .asPartial(),
    rt
      .Record({
        changes: rt.Array(changeRt),
        url: rt.String,
        currency: currencyRt,
        amountExcludingVatCurrency: rt.Number,
        amountIncludingVatCurrency: rt.Number,
      })
      .asPartial()
      .asReadonly(),
  ),
);

type PurchaseOrder = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  readonly number?: string;
  receiverEmail?: string;
  discount?: number;
  packingNoteMessage?: string;
  transporterMessage?: string;
  comments?: string;
  supplier?: Supplier;
  deliveryDate?: string;
  readonly orderLines?: PurchaseOrderline[];
  project?: Project;
  department?: Department;
  deliveryAddress?: Address;
  creationDate?: string;
  isClosed?: boolean;
  ourContact?: Employee;
  supplierContact?: Employee;
  attention?: Employee;
  readonly status?:
    | 'STATUS_OPEN'
    | 'STATUS_SENT'
    | 'STATUS_RECEIVING'
    | 'STATUS_CONFIRMED_DEVIATION_DETECTED'
    | 'STATUS_DEVIATION_OPEN'
    | 'STATUS_DEVIATION_CONFIRMED'
    | 'STATUS_CONFIRMED';
  currency?: Currency;
  readonly restorder?: PurchaseOrder;
  transportType?: TransportType;
  pickupPoint?: PickupPoint;
  readonly document?: Document;
  readonly attachment?: Document;
  readonly ediDocument?: Document;
};

const purchaseOrderRt: rt.Runtype<PurchaseOrder> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        receiverEmail: rt.String,
        discount: rt.Number,
        packingNoteMessage: rt.String,
        transporterMessage: rt.String,
        comments: rt.String,
        supplier: supplierRt,
        deliveryDate: rt.String,
        project: projectRt,
        department: departmentRt,
        deliveryAddress: addressRt,
        creationDate: rt.String,
        isClosed: rt.Boolean,
        ourContact: employeeRt,
        supplierContact: employeeRt,
        attention: employeeRt,
        currency: currencyRt,
        transportType: transportTypeRt,
        pickupPoint: pickupPointRt,
      })
      .asPartial(),
    rt
      .Record({
        changes: rt.Array(changeRt),
        url: rt.String,
        number: rt.String,
        orderLines: rt.Array(purchaseOrderlineRt),
        status: rt.Union(
          rt.Literal('STATUS_OPEN'),
          rt.Literal('STATUS_SENT'),
          rt.Literal('STATUS_RECEIVING'),
          rt.Literal('STATUS_CONFIRMED_DEVIATION_DETECTED'),
          rt.Literal('STATUS_DEVIATION_OPEN'),
          rt.Literal('STATUS_DEVIATION_CONFIRMED'),
          rt.Literal('STATUS_CONFIRMED'),
        ),
        restorder: purchaseOrderRt,
        document: documentRt,
        attachment: documentRt,
        ediDocument: documentRt,
      })
      .asPartial()
      .asReadonly(),
  ),
);

const responseWrapperPurchaseOrderRt = rt
  .Record({ value: purchaseOrderRt })
  .asPartial();

type ResponseWrapperPurchaseOrder = rt.Static<
  typeof responseWrapperPurchaseOrderRt
>;

const listResponsePurchaseOrderRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(purchaseOrderRt),
  })
  .asPartial();

type ListResponsePurchaseOrder = rt.Static<typeof listResponsePurchaseOrderRt>;

const responseWrapperTransportTypeRt = rt
  .Record({ value: transportTypeRt })
  .asPartial();

type ResponseWrapperTransportType = rt.Static<
  typeof responseWrapperTransportTypeRt
>;

const listResponseTransportTypeRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(transportTypeRt),
  })
  .asPartial();

type ListResponseTransportType = rt.Static<typeof listResponseTransportTypeRt>;

const deviationRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      purchaseOrderLine: orderLineRt,
      date: rt.String,
      cause: rt.Union(
        rt.Literal('CAUSE_DEFECT'),
        rt.Literal('CAUSE_TOO_FEW'),
        rt.Literal('CAUSE_TOO_MANY'),
        rt.Literal('CAUSE_REPLACEMENT'),
      ),
      action: rt.Union(
        rt.Literal('ACTION_IGNORE'),
        rt.Literal('ACTION_GENERATE_RESTORDER'),
        rt.Literal('ACTION_RETURN'),
        rt.Literal('ACTION_RETURN_GENERATE_RESTORDER'),
      ),
      comment: rt.String,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      receivedBy: rt.String,
      quantityOrdered: rt.Number,
      quantityReceived: rt.Number,
      deviation: rt.Number,
    })
    .asPartial()
    .asReadonly(),
);

type Deviation = rt.Static<typeof deviationRt>;

const responseWrapperDeviationRt = rt
  .Record({ value: deviationRt })
  .asPartial();

type ResponseWrapperDeviation = rt.Static<typeof responseWrapperDeviationRt>;

const listResponseDeviationRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(deviationRt),
  })
  .asPartial();

type ListResponseDeviation = rt.Static<typeof listResponseDeviationRt>;

const goodsReceiptLineRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      purchaseOrder: purchaseOrderRt,
      product: productRt,
      inventory: inventoryRt,
      inventoryLocation: inventoryLocationRt,
      quantityReceived: rt.Number,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      quantityOrdered: rt.Number,
      quantityRest: rt.Number,
      deviation: rt.Number,
    })
    .asPartial()
    .asReadonly(),
);

type GoodsReceiptLine = rt.Static<typeof goodsReceiptLineRt>;

const goodsReceiptRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      purchaseOrder: purchaseOrderRt,
      registrationDate: rt.String,
      goodsReceiptLines: rt.Array(goodsReceiptLineRt),
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      receivedBy: employeeRt,
      status: rt.Union(
        rt.Literal('STATUS_OPEN'),
        rt.Literal('STATUS_CONFIRMED'),
      ),
    })
    .asPartial()
    .asReadonly(),
);

type GoodsReceipt = rt.Static<typeof goodsReceiptRt>;

const responseWrapperGoodsReceiptRt = rt
  .Record({ value: goodsReceiptRt })
  .asPartial();

type ResponseWrapperGoodsReceipt = rt.Static<
  typeof responseWrapperGoodsReceiptRt
>;

const listResponseGoodsReceiptRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(goodsReceiptRt),
  })
  .asPartial();

type ListResponseGoodsReceipt = rt.Static<typeof listResponseGoodsReceiptRt>;

const responseWrapperGoodsReceiptLineRt = rt
  .Record({ value: goodsReceiptLineRt })
  .asPartial();

type ResponseWrapperGoodsReceiptLine = rt.Static<
  typeof responseWrapperGoodsReceiptLineRt
>;

const listResponseGoodsReceiptLineRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(goodsReceiptLineRt),
  })
  .asPartial();

type ListResponseGoodsReceiptLine = rt.Static<
  typeof listResponseGoodsReceiptLineRt
>;

const purchaseOrderIncomingInvoiceRelationRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      orderOut: purchaseOrderRt,
      voucher: voucherRt,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type PurchaseOrderIncomingInvoiceRelation = rt.Static<
  typeof purchaseOrderIncomingInvoiceRelationRt
>;

const responseWrapperPurchaseOrderIncomingInvoiceRelationRt = rt
  .Record({ value: purchaseOrderIncomingInvoiceRelationRt })
  .asPartial();

type ResponseWrapperPurchaseOrderIncomingInvoiceRelation = rt.Static<
  typeof responseWrapperPurchaseOrderIncomingInvoiceRelationRt
>;

const listResponsePurchaseOrderIncomingInvoiceRelationRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(purchaseOrderIncomingInvoiceRelationRt),
  })
  .asPartial();

type ListResponsePurchaseOrderIncomingInvoiceRelation = rt.Static<
  typeof listResponsePurchaseOrderIncomingInvoiceRelationRt
>;

const responseWrapperPurchaseOrderlineRt = rt
  .Record({ value: purchaseOrderlineRt })
  .asPartial();

type ResponseWrapperPurchaseOrderline = rt.Static<
  typeof responseWrapperPurchaseOrderlineRt
>;

const responseWrapperReminderRt = rt.Record({ value: reminderRt }).asPartial();

type ResponseWrapperReminder = rt.Static<typeof responseWrapperReminderRt>;

const listResponseReminderRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(reminderRt),
  })
  .asPartial();

type ListResponseReminder = rt.Static<typeof listResponseReminderRt>;

const reportFilterRangeRt = rt
  .Record({ from: rt.Number, to: rt.Number, version: rt.Number })
  .asPartial();

type ReportFilterRange = rt.Static<typeof reportFilterRangeRt>;

const reportFilterSingularRt = rt
  .Record({ id: rt.Number, version: rt.Number })
  .asPartial();

type ReportFilterSingular = rt.Static<typeof reportFilterSingularRt>;

const reportFilterAccountRt = rt
  .Record({
    rangeFilters: rt.Array(reportFilterRangeRt),
    singularFilters: rt.Array(reportFilterSingularRt),
    version: rt.Number,
  })
  .asPartial();

type ReportFilterAccount = rt.Static<typeof reportFilterAccountRt>;

const reportFilterCustomerRt = rt
  .Record({ filters: rt.Array(reportFilterSingularRt), version: rt.Number })
  .asPartial();

type ReportFilterCustomer = rt.Static<typeof reportFilterCustomerRt>;

const reportFilterDepartmentRt = rt
  .Record({ filters: rt.Array(reportFilterSingularRt), version: rt.Number })
  .asPartial();

type ReportFilterDepartment = rt.Static<typeof reportFilterDepartmentRt>;

const reportFilterEmployeeRt = rt
  .Record({ filters: rt.Array(reportFilterSingularRt), version: rt.Number })
  .asPartial();

type ReportFilterEmployee = rt.Static<typeof reportFilterEmployeeRt>;

const reportFilterPeriodRt = rt
  .Record({
    type: rt.Number,
    start: rt.String,
    end: rt.String,
    relativeToPerpendicular: rt.Boolean,
    version: rt.Number,
  })
  .asPartial();

type ReportFilterPeriod = rt.Static<typeof reportFilterPeriodRt>;

const reportFilterProductRt = rt
  .Record({ filters: rt.Array(reportFilterSingularRt), version: rt.Number })
  .asPartial();

type ReportFilterProduct = rt.Static<typeof reportFilterProductRt>;

const reportFilterProjectRt = rt
  .Record({ filters: rt.Array(reportFilterSingularRt), version: rt.Number })
  .asPartial();

type ReportFilterProject = rt.Static<typeof reportFilterProjectRt>;

const reportFilterSupplierRt = rt
  .Record({ filters: rt.Array(reportFilterSingularRt), version: rt.Number })
  .asPartial();

type ReportFilterSupplier = rt.Static<typeof reportFilterSupplierRt>;

const reportGroupFilterRt = rt
  .Record({
    account: reportFilterAccountRt,
    customer: reportFilterCustomerRt,
    department: reportFilterDepartmentRt,
    employee: reportFilterEmployeeRt,
    period: reportFilterPeriodRt,
    product: reportFilterProductRt,
    project: reportFilterProjectRt,
    supplier: reportFilterSupplierRt,
    version: rt.Number,
  })
  .asPartial();

type ReportGroupFilter = rt.Static<typeof reportGroupFilterRt>;

type ReportGroup = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  name?: string;
  description?: string;
  autoGroupType?:
    | 'None'
    | 'Account'
    | 'Department'
    | 'Customer'
    | 'Supplier'
    | 'Employee'
    | 'Product'
    | 'Project'
    | 'PeriodMonths'
    | 'PeriodYears'
    | 'PeriodQuarters'
    | 'PeriodVATTerms'
    | 'PeriodWeeks'
    | 'PeriodDays';
  expression?: string;
  variableName?: string;
  precedence?: number;
  valueFormat?: string;
  cellFormat?: string;
  hideSelf?: boolean;
  filter?: ReportGroupFilter;
  children?: ReportGroup[];
};

const reportGroupRt: rt.Runtype<ReportGroup> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        name: rt.String,
        description: rt.String,
        autoGroupType: rt.Union(
          rt.Literal('None'),
          rt.Literal('Account'),
          rt.Literal('Department'),
          rt.Literal('Customer'),
          rt.Literal('Supplier'),
          rt.Literal('Employee'),
          rt.Literal('Product'),
          rt.Literal('Project'),
          rt.Literal('PeriodMonths'),
          rt.Literal('PeriodYears'),
          rt.Literal('PeriodQuarters'),
          rt.Literal('PeriodVATTerms'),
          rt.Literal('PeriodWeeks'),
          rt.Literal('PeriodDays'),
        ),
        expression: rt.String,
        variableName: rt.String,
        precedence: rt.Number,
        valueFormat: rt.String,
        cellFormat: rt.String,
        hideSelf: rt.Boolean,
        filter: reportGroupFilterRt,
        children: rt.Array(reportGroupRt),
      })
      .asPartial(),
    rt
      .Record({ changes: rt.Array(changeRt), url: rt.String })
      .asPartial()
      .asReadonly(),
  ),
);

const reportRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      name: rt.String,
      description: rt.String,
      groups: rt.Array(reportGroupRt),
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type Report = rt.Static<typeof reportRt>;

const responseWrapperReportRt = rt.Record({ value: reportRt }).asPartial();

type ResponseWrapperReport = rt.Static<typeof responseWrapperReportRt>;

const listResponseReportRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(reportRt),
  })
  .asPartial();

type ListResponseReport = rt.Static<typeof listResponseReportRt>;

const responseWrapperReportGroupRt = rt
  .Record({ value: reportGroupRt })
  .asPartial();

type ResponseWrapperReportGroup = rt.Static<
  typeof responseWrapperReportGroupRt
>;

const systemReportDTORt = rt
  .Record({ textKey: rt.String, text: rt.String, path: rt.String })
  .asPartial();

type SystemReportDTO = rt.Static<typeof systemReportDTORt>;

type SystemReportCategoryDTO = {
  textKey?: string;
  theme?: string;
  icon?: string;
  reports?: SystemReportDTO[];
  subCategories?: SystemReportCategoryDTO[];
};

const systemReportCategoryDTORt: rt.Runtype<SystemReportCategoryDTO> = rt.Lazy(
  () =>
    rt
      .Record({
        textKey: rt.String,
        theme: rt.String,
        icon: rt.String,
        reports: rt.Array(systemReportDTORt),
        subCategories: rt.Array(systemReportCategoryDTORt),
      })
      .asPartial(),
);

const listResponseSystemReportCategoryDTORt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(systemReportCategoryDTORt),
  })
  .asPartial();

type ListResponseSystemReportCategoryDTO = rt.Static<
  typeof listResponseSystemReportCategoryDTORt
>;

const resultBudgetRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      account: accountRt,
      accountingPeriod: accountingPeriodRt,
      amount: rt.Number,
      department: departmentRt,
      project: projectRt,
      product: productRt,
      employee: employeeRt,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type ResultBudget = rt.Static<typeof resultBudgetRt>;

const responseWrapperResultBudgetRt = rt
  .Record({ value: resultBudgetRt })
  .asPartial();

type ResponseWrapperResultBudget = rt.Static<
  typeof responseWrapperResultBudgetRt
>;

const listResponseResultBudgetRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(resultBudgetRt),
  })
  .asPartial();

type ListResponseResultBudget = rt.Static<typeof listResponseResultBudgetRt>;

const responseWrapperSalaryTypeRt = rt
  .Record({ value: salaryTypeRt })
  .asPartial();

type ResponseWrapperSalaryType = rt.Static<typeof responseWrapperSalaryTypeRt>;

const listResponseSalaryTypeRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(salaryTypeRt),
  })
  .asPartial();

type ListResponseSalaryType = rt.Static<typeof listResponseSalaryTypeRt>;

const salaryCompilationLineRt = rt
  .Record({
    description: rt.String,
    amount: rt.Number,
    taxable: rt.Boolean,
    taxableDescription: rt.String,
  })
  .asPartial()
  .asReadonly();

type SalaryCompilationLine = rt.Static<typeof salaryCompilationLineRt>;

const salaryCompilationRt = rt
  .Record({
    employee: rt.Number,
    year: rt.Number,
    vacationPayBasis: rt.Number,
    wages: rt.Array(salaryCompilationLineRt),
    expenses: rt.Array(salaryCompilationLineRt),
    taxDeductions: rt.Array(salaryCompilationLineRt),
    mandatoryTaxDeductions: rt.Array(salaryCompilationLineRt),
  })
  .asPartial()
  .asReadonly();

type SalaryCompilation = rt.Static<typeof salaryCompilationRt>;

const responseWrapperSalaryCompilationRt = rt
  .Record({ value: salaryCompilationRt })
  .asPartial();

type ResponseWrapperSalaryCompilation = rt.Static<
  typeof responseWrapperSalaryCompilationRt
>;

const responseWrapperPayslipRt = rt.Record({ value: payslipRt }).asPartial();

type ResponseWrapperPayslip = rt.Static<typeof responseWrapperPayslipRt>;

const listResponsePayslipRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(payslipRt),
  })
  .asPartial();

type ListResponsePayslip = rt.Static<typeof listResponsePayslipRt>;

const salarySettingsRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      municipality: municipalityRt,
      payrollTaxCalcMethod: rt.Union(
        rt.Literal('AA'),
        rt.Literal('BB'),
        rt.Literal('CC'),
        rt.Literal('DD'),
        rt.Literal('EE'),
        rt.Literal('GG'),
        rt.Literal('JJ'),
        rt.Literal('EMPTY'),
      ),
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type SalarySettings = rt.Static<typeof salarySettingsRt>;

const responseWrapperSalarySettingsRt = rt
  .Record({ value: salarySettingsRt })
  .asPartial();

type ResponseWrapperSalarySettings = rt.Static<
  typeof responseWrapperSalarySettingsRt
>;

const companyHolidayRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      year: rt.Number,
      days: rt.Number,
      vacationPayPercentage1: rt.Number,
      vacationPayPercentage2: rt.Number,
      isMaxPercentage2Amount6G: rt.Boolean,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type CompanyHoliday = rt.Static<typeof companyHolidayRt>;

const responseWrapperCompanyHolidayRt = rt
  .Record({ value: companyHolidayRt })
  .asPartial();

type ResponseWrapperCompanyHoliday = rt.Static<
  typeof responseWrapperCompanyHolidayRt
>;

const listResponseCompanyHolidayRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(companyHolidayRt),
  })
  .asPartial();

type ListResponseCompanyHoliday = rt.Static<
  typeof listResponseCompanyHolidayRt
>;

const pensionSchemeRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      number: rt.String,
      startDate: rt.String,
      endDate: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type PensionScheme = rt.Static<typeof pensionSchemeRt>;

const responseWrapperPensionSchemeRt = rt
  .Record({ value: pensionSchemeRt })
  .asPartial();

type ResponseWrapperPensionScheme = rt.Static<
  typeof responseWrapperPensionSchemeRt
>;

const listResponsePensionSchemeRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(pensionSchemeRt),
  })
  .asPartial();

type ListResponsePensionScheme = rt.Static<typeof listResponsePensionSchemeRt>;

const responseWrapperSalarySpecificationRt = rt
  .Record({ value: salarySpecificationRt })
  .asPartial();

type ResponseWrapperSalarySpecification = rt.Static<
  typeof responseWrapperSalarySpecificationRt
>;

const listResponseSalarySpecificationRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(salarySpecificationRt),
  })
  .asPartial();

type ListResponseSalarySpecification = rt.Static<
  typeof listResponseSalarySpecificationRt
>;

const responseWrapperSalaryTransactionRt = rt
  .Record({ value: salaryTransactionRt })
  .asPartial();

type ResponseWrapperSalaryTransaction = rt.Static<
  typeof responseWrapperSalaryTransactionRt
>;

const listResponseSalaryTransactionRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(salaryTransactionRt),
  })
  .asPartial();

type ListResponseSalaryTransaction = rt.Static<
  typeof listResponseSalaryTransactionRt
>;

const responseWrapperSupplierRt = rt.Record({ value: supplierRt }).asPartial();

type ResponseWrapperSupplier = rt.Static<typeof responseWrapperSupplierRt>;

const listResponseSupplierRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(supplierRt),
  })
  .asPartial();

type ListResponseSupplier = rt.Static<typeof listResponseSupplierRt>;

const voucherApprovalListElementRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      comment: rt.String,
      commentFromOriginator: rt.String,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      voucher: voucherRt,
      employee: employeeRt,
      status: rt.Number,
      organisationLevel: rt.Number,
      department: departmentRt,
      project: projectRt,
      actionDate: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

type VoucherApprovalListElement = rt.Static<
  typeof voucherApprovalListElementRt
>;

const supplierInvoiceRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      invoiceNumber: rt.String,
      invoiceDate: rt.String,
      supplier: supplierRt,
      invoiceDueDate: rt.String,
      kidOrReceiverReference: rt.String,
      voucher: voucherRt,
      amountCurrency: rt.Number,
      currency: currencyRt,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      amount: rt.Number,
      amountExcludingVat: rt.Number,
      amountExcludingVatCurrency: rt.Number,
      isCreditNote: rt.Boolean,
      orderLines: rt.Array(orderLineRt),
      payments: rt.Array(postingRt),
      originalInvoiceDocumentId: rt.Number,
      approvalListElements: rt.Array(voucherApprovalListElementRt),
    })
    .asPartial()
    .asReadonly(),
);

type SupplierInvoice = rt.Static<typeof supplierInvoiceRt>;

const responseWrapperSupplierInvoiceRt = rt
  .Record({ value: supplierInvoiceRt })
  .asPartial();

type ResponseWrapperSupplierInvoice = rt.Static<
  typeof responseWrapperSupplierInvoiceRt
>;

const listResponseSupplierInvoiceRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(supplierInvoiceRt),
  })
  .asPartial();

type ListResponseSupplierInvoice = rt.Static<
  typeof listResponseSupplierInvoiceRt
>;

const orderLinePostingDTORt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      posting: postingRt,
      orderLine: orderLineRt,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type OrderLinePostingDTO = rt.Static<typeof orderLinePostingDTORt>;

const responseWrapperVoucherApprovalListElementRt = rt
  .Record({ value: voucherApprovalListElementRt })
  .asPartial();

type ResponseWrapperVoucherApprovalListElement = rt.Static<
  typeof responseWrapperVoucherApprovalListElementRt
>;

type TimeClock = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  employee?: Employee;
  project?: Project;
  activity?: Activity;
  timesheetEntry?: TimesheetEntry;
  date?: string;
  timeStart?: string;
  timeStop?: string;
  hoursStart?: number;
};

const timeClockRt: rt.Runtype<TimeClock> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        employee: employeeRt,
        project: projectRt,
        activity: activityRt,
        timesheetEntry: timesheetEntryRt,
        date: rt.String,
        timeStart: rt.String,
        timeStop: rt.String,
        hoursStart: rt.Number,
      })
      .asPartial(),
    rt
      .Record({ changes: rt.Array(changeRt), url: rt.String })
      .asPartial()
      .asReadonly(),
  ),
);

type TimesheetEntry = {
  id?: number;
  version?: number;
  readonly changes?: Change[];
  readonly url?: string;
  project?: Project;
  activity?: Activity;
  date?: string;
  hours?: number;
  readonly chargeableHours?: number;
  employee?: Employee;
  readonly timeClocks?: TimeClock[];
  comment?: string;
  readonly locked?: boolean;
  readonly chargeable?: boolean;
  readonly invoice?: Invoice;
  readonly hourlyRate?: number;
  readonly hourlyCost?: number;
  readonly hourlyCostPercentage?: number;
};

const timesheetEntryRt: rt.Runtype<TimesheetEntry> = rt.Lazy(() =>
  rt.Intersect(
    rt
      .Record({
        id: rt.Number,
        version: rt.Number,
        project: projectRt,
        activity: activityRt,
        date: rt.String,
        hours: rt.Number,
        employee: employeeRt,
        comment: rt.String,
      })
      .asPartial(),
    rt
      .Record({
        changes: rt.Array(changeRt),
        url: rt.String,
        chargeableHours: rt.Number,
        timeClocks: rt.Array(timeClockRt),
        locked: rt.Boolean,
        chargeable: rt.Boolean,
        invoice: invoiceRt,
        hourlyRate: rt.Number,
        hourlyCost: rt.Number,
        hourlyCostPercentage: rt.Number,
      })
      .asPartial()
      .asReadonly(),
  ),
);

const responseWrapperTimesheetEntryRt = rt
  .Record({ value: timesheetEntryRt })
  .asPartial();

type ResponseWrapperTimesheetEntry = rt.Static<
  typeof responseWrapperTimesheetEntryRt
>;

const listResponseTimesheetEntryRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(timesheetEntryRt),
  })
  .asPartial();

type ListResponseTimesheetEntry = rt.Static<
  typeof listResponseTimesheetEntryRt
>;

const responseWrapperBigDecimalRt = rt.Record({ value: rt.Number }).asPartial();

type ResponseWrapperBigDecimal = rt.Static<typeof responseWrapperBigDecimalRt>;

const timesheetEntrySearchResponseRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(timesheetEntryRt),
    sumAllHours: rt.Number,
  })
  .asPartial();

type TimesheetEntrySearchResponse = rt.Static<
  typeof timesheetEntrySearchResponseRt
>;

const employeePeriodRt = rt
  .Record({
    incomingVacationBalance: rt.Number,
    outgoingVacationBalance: rt.Number,
    vacationTakenInPeriod: rt.Number,
    vacationTakenThisYear: rt.Number,
  })
  .asPartial()
  .asReadonly();

type EmployeePeriod = rt.Static<typeof employeePeriodRt>;

const flexSummaryRt = rt
  .Record({
    incomingHourBalance: rt.Number,
    outgoingHourBalance: rt.Number,
    change: rt.Number,
  })
  .asPartial()
  .asReadonly();

type FlexSummary = rt.Static<typeof flexSummaryRt>;

const hourSummaryRt = rt
  .Record({
    sumHours: rt.Number,
    hoursWithPay: rt.Number,
    hourlyWageHoursWithPay: rt.Number,
    standardTime: rt.Number,
    nonChargeableHours: rt.Number,
    chargeableHours: rt.Number,
    nonChargeableHoursWithPay: rt.Number,
    budgetChargeableHours: rt.Number,
  })
  .asPartial()
  .asReadonly();

type HourSummary = rt.Static<typeof hourSummaryRt>;

const monthlyStatusRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      hoursPayout: rt.Number,
      vacationPayout: rt.Number,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      employee: employeeRt,
      timesheetEntries: rt.Array(timesheetEntryRt),
      approvedDate: rt.String,
      completed: rt.Boolean,
      approvedBy: employeeRt,
      approved: rt.Boolean,
      approvedUntilDate: rt.String,
      monthYear: rt.String,
      hourSummary: hourSummaryRt,
      flexSummary: flexSummaryRt,
      vacationSummary: employeePeriodRt,
    })
    .asPartial()
    .asReadonly(),
);

type MonthlyStatus = rt.Static<typeof monthlyStatusRt>;

const listResponseMonthlyStatusRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(monthlyStatusRt),
  })
  .asPartial();

type ListResponseMonthlyStatus = rt.Static<typeof listResponseMonthlyStatusRt>;

const responseWrapperMonthlyStatusRt = rt
  .Record({ value: monthlyStatusRt })
  .asPartial();

type ResponseWrapperMonthlyStatus = rt.Static<
  typeof responseWrapperMonthlyStatusRt
>;

const timesheetSalaryTypeSpecificationRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      employee: employeeRt,
      salaryType: salaryTypeRt,
      description: rt.String,
      date: rt.String,
      count: rt.Number,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type TimesheetSalaryTypeSpecification = rt.Static<
  typeof timesheetSalaryTypeSpecificationRt
>;

const responseWrapperTimesheetSalaryTypeSpecificationRt = rt
  .Record({ value: timesheetSalaryTypeSpecificationRt })
  .asPartial();

type ResponseWrapperTimesheetSalaryTypeSpecification = rt.Static<
  typeof responseWrapperTimesheetSalaryTypeSpecificationRt
>;

const listResponseTimesheetSalaryTypeSpecificationRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(timesheetSalaryTypeSpecificationRt),
  })
  .asPartial();

type ListResponseTimesheetSalaryTypeSpecification = rt.Static<
  typeof listResponseTimesheetSalaryTypeSpecificationRt
>;

const timesheetSettingsRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      timeClock: rt.Boolean,
      timesheetCompleted: rt.Boolean,
      flexBalance: rt.Boolean,
      vacationBalance: rt.Boolean,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type TimesheetSettings = rt.Static<typeof timesheetSettingsRt>;

const responseWrapperTimesheetSettingsRt = rt
  .Record({ value: timesheetSettingsRt })
  .asPartial();

type ResponseWrapperTimesheetSettings = rt.Static<
  typeof responseWrapperTimesheetSettingsRt
>;

const responseWrapperTimeClockRt = rt
  .Record({ value: timeClockRt })
  .asPartial();

type ResponseWrapperTimeClock = rt.Static<typeof responseWrapperTimeClockRt>;

const listResponseTimeClockRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(timeClockRt),
  })
  .asPartial();

type ListResponseTimeClock = rt.Static<typeof listResponseTimeClockRt>;

const weekRt = rt.Intersect(
  rt.Record({ id: rt.Number, version: rt.Number }).asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      employee: employeeRt,
      timesheetEntries: rt.Array(timesheetEntryRt),
      year: rt.Number,
      week: rt.Number,
      completed: rt.Boolean,
      approved: rt.Boolean,
      approvedBy: employeeRt,
      approvedDate: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

type Week = rt.Static<typeof weekRt>;

const responseWrapperWeekRt = rt.Record({ value: weekRt }).asPartial();

type ResponseWrapperWeek = rt.Static<typeof responseWrapperWeekRt>;

const listResponseWeekRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(weekRt),
  })
  .asPartial();

type ListResponseWeek = rt.Static<typeof listResponseWeekRt>;

const responseWrapperAccommodationAllowanceRt = rt
  .Record({ value: accommodationAllowanceRt })
  .asPartial();

type ResponseWrapperAccommodationAllowance = rt.Static<
  typeof responseWrapperAccommodationAllowanceRt
>;

const listResponseAccommodationAllowanceRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(accommodationAllowanceRt),
  })
  .asPartial();

type ListResponseAccommodationAllowance = rt.Static<
  typeof listResponseAccommodationAllowanceRt
>;

const responseWrapperCostRt = rt.Record({ value: costRt }).asPartial();

type ResponseWrapperCost = rt.Static<typeof responseWrapperCostRt>;

const listResponseCostRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(costRt),
  })
  .asPartial();

type ListResponseCost = rt.Static<typeof listResponseCostRt>;

const responseWrapperMileageAllowanceRt = rt
  .Record({ value: mileageAllowanceRt })
  .asPartial();

type ResponseWrapperMileageAllowance = rt.Static<
  typeof responseWrapperMileageAllowanceRt
>;

const listResponseMileageAllowanceRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(mileageAllowanceRt),
  })
  .asPartial();

type ListResponseMileageAllowance = rt.Static<
  typeof listResponseMileageAllowanceRt
>;

const responseWrapperPassengerRt = rt
  .Record({ value: passengerRt })
  .asPartial();

type ResponseWrapperPassenger = rt.Static<typeof responseWrapperPassengerRt>;

const listResponsePassengerRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(passengerRt),
  })
  .asPartial();

type ListResponsePassenger = rt.Static<typeof listResponsePassengerRt>;

const responseWrapperPerDiemCompensationRt = rt
  .Record({ value: perDiemCompensationRt })
  .asPartial();

type ResponseWrapperPerDiemCompensation = rt.Static<
  typeof responseWrapperPerDiemCompensationRt
>;

const perDiemCompensationTransientDTORt = rt
  .Record({
    travelExpense: travelExpenseRt,
    rateType: travelExpenseRateRt,
    rateCategory: travelExpenseRateCategoryRt,
    countryCode: rt.String,
    travelExpenseZoneId: rt.Number,
    overnightAccommodation: rt.Union(
      rt.Literal('NONE'),
      rt.Literal('HOTEL'),
      rt.Literal('BOARDING_HOUSE_WITHOUT_COOKING'),
      rt.Literal('BOARDING_HOUSE_WITH_COOKING'),
    ),
    location: rt.String,
    address: rt.String,
    count: rt.Number,
    rate: rt.Number,
    amount: rt.Number,
    isDeductionForBreakfast: rt.Boolean,
    isDeductionForLunch: rt.Boolean,
    isDeductionForDinner: rt.Boolean,
  })
  .asPartial();

type PerDiemCompensationTransientDTO = rt.Static<
  typeof perDiemCompensationTransientDTORt
>;

const listResponsePerDiemCompensationTransientDTORt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(perDiemCompensationTransientDTORt),
  })
  .asPartial();

type ListResponsePerDiemCompensationTransientDTO = rt.Static<
  typeof listResponsePerDiemCompensationTransientDTORt
>;

const listResponsePerDiemCompensationRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(perDiemCompensationRt),
  })
  .asPartial();

type ListResponsePerDiemCompensation = rt.Static<
  typeof listResponsePerDiemCompensationRt
>;

const responseWrapperTravelExpenseRt = rt
  .Record({ value: travelExpenseRt })
  .asPartial();

type ResponseWrapperTravelExpense = rt.Static<
  typeof responseWrapperTravelExpenseRt
>;

const listResponseTravelExpenseRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(travelExpenseRt),
  })
  .asPartial();

type ListResponseTravelExpense = rt.Static<typeof listResponseTravelExpenseRt>;

const contentDispositionRt = rt
  .Record({
    type: rt.String,
    parameters: rt.Dictionary(rt.Unknown),
    fileName: rt.String,
    creationDate: rt.String,
    modificationDate: rt.String,
    readDate: rt.String,
    size: rt.Number,
  })
  .asPartial();

type ContentDisposition = rt.Static<typeof contentDispositionRt>;

const mediaTypeRt = rt
  .Record({
    type: rt.String,
    subtype: rt.String,
    parameters: rt.Dictionary(rt.Unknown),
    wildcardType: rt.Boolean,
    wildcardSubtype: rt.Boolean,
  })
  .asPartial();

type MediaType = rt.Static<typeof mediaTypeRt>;

const messageBodyWorkersRt = rt.Dictionary(rt.Unknown);

type MessageBodyWorkers = rt.Static<typeof messageBodyWorkersRt>;

const providersRt = rt.Dictionary(rt.Unknown);

type Providers = rt.Static<typeof providersRt>;

type MultiPart = {
  contentDisposition?: ContentDisposition;
  entity?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  mediaType?: MediaType;
  messageBodyWorkers?: MessageBodyWorkers;
  parent?: MultiPart;
  providers?: Providers;
  bodyParts?: BodyPart[];
  parameterizedHeaders?: Record<string, unknown>;
};

const multiPartRt: rt.Runtype<MultiPart> = rt.Lazy(() =>
  rt
    .Record({
      contentDisposition: contentDispositionRt,
      entity: rt.Dictionary(rt.Unknown),
      headers: rt.Dictionary(rt.Unknown),
      mediaType: mediaTypeRt,
      messageBodyWorkers: messageBodyWorkersRt,
      parent: multiPartRt,
      providers: providersRt,
      bodyParts: rt.Array(bodyPartRt),
      parameterizedHeaders: rt.Dictionary(rt.Unknown),
    })
    .asPartial(),
);

type BodyPart = {
  contentDisposition?: ContentDisposition;
  entity?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  mediaType?: MediaType;
  messageBodyWorkers?: MessageBodyWorkers;
  parent?: MultiPart;
  providers?: Providers;
  parameterizedHeaders?: Record<string, unknown>;
};

const bodyPartRt: rt.Runtype<BodyPart> = rt.Lazy(() =>
  rt
    .Record({
      contentDisposition: contentDispositionRt,
      entity: rt.Dictionary(rt.Unknown),
      headers: rt.Dictionary(rt.Unknown),
      mediaType: mediaTypeRt,
      messageBodyWorkers: messageBodyWorkersRt,
      parent: multiPartRt,
      providers: providersRt,
      parameterizedHeaders: rt.Dictionary(rt.Unknown),
    })
    .asPartial(),
);

const formDataContentDispositionRt = rt
  .Record({
    type: rt.String,
    parameters: rt.Dictionary(rt.Unknown),
    fileName: rt.String,
    creationDate: rt.String,
    modificationDate: rt.String,
    readDate: rt.String,
    size: rt.Number,
    name: rt.String,
  })
  .asPartial();

type FormDataContentDisposition = rt.Static<
  typeof formDataContentDispositionRt
>;

const formDataBodyPartRt = rt
  .Record({
    contentDisposition: contentDispositionRt,
    entity: rt.Dictionary(rt.Unknown),
    headers: rt.Dictionary(rt.Unknown),
    mediaType: mediaTypeRt,
    messageBodyWorkers: messageBodyWorkersRt,
    parent: multiPartRt,
    providers: providersRt,
    formDataContentDisposition: formDataContentDispositionRt,
    simple: rt.Boolean,
    name: rt.String,
    value: rt.String,
    parameterizedHeaders: rt.Dictionary(rt.Unknown),
  })
  .asPartial();

type FormDataBodyPart = rt.Static<typeof formDataBodyPartRt>;

const formDataMultiPartRt = rt
  .Record({
    contentDisposition: contentDispositionRt,
    entity: rt.Dictionary(rt.Unknown),
    headers: rt.Dictionary(rt.Unknown),
    mediaType: mediaTypeRt,
    messageBodyWorkers: messageBodyWorkersRt,
    parent: multiPartRt,
    providers: providersRt,
    bodyParts: rt.Array(bodyPartRt),
    fields: rt.Dictionary(rt.Unknown),
    parameterizedHeaders: rt.Dictionary(rt.Unknown),
  })
  .asPartial();

type FormDataMultiPart = rt.Static<typeof formDataMultiPartRt>;

const parameterizedHeaderRt = rt
  .Record({ value: rt.String, parameters: rt.Dictionary(rt.Unknown) })
  .asPartial();

type ParameterizedHeader = rt.Static<typeof parameterizedHeaderRt>;

const responseWrapperTravelExpenseRateRt = rt
  .Record({ value: travelExpenseRateRt })
  .asPartial();

type ResponseWrapperTravelExpenseRate = rt.Static<
  typeof responseWrapperTravelExpenseRateRt
>;

const listResponseTravelExpenseRateRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(travelExpenseRateRt),
  })
  .asPartial();

type ListResponseTravelExpenseRate = rt.Static<
  typeof listResponseTravelExpenseRateRt
>;

const responseWrapperTravelExpenseRateCategoryRt = rt
  .Record({ value: travelExpenseRateCategoryRt })
  .asPartial();

type ResponseWrapperTravelExpenseRateCategory = rt.Static<
  typeof responseWrapperTravelExpenseRateCategoryRt
>;

const listResponseTravelExpenseRateCategoryRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(travelExpenseRateCategoryRt),
  })
  .asPartial();

type ListResponseTravelExpenseRateCategory = rt.Static<
  typeof listResponseTravelExpenseRateCategoryRt
>;

const travelExpenseRateCategoryGroupRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      isForeignTravel: rt.Boolean,
      fromDate: rt.String,
      toDate: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String, name: rt.String })
    .asPartial()
    .asReadonly(),
);

type TravelExpenseRateCategoryGroup = rt.Static<
  typeof travelExpenseRateCategoryGroupRt
>;

const responseWrapperTravelExpenseRateCategoryGroupRt = rt
  .Record({ value: travelExpenseRateCategoryGroupRt })
  .asPartial();

type ResponseWrapperTravelExpenseRateCategoryGroup = rt.Static<
  typeof responseWrapperTravelExpenseRateCategoryGroupRt
>;

const listResponseTravelExpenseRateCategoryGroupRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(travelExpenseRateCategoryGroupRt),
  })
  .asPartial();

type ListResponseTravelExpenseRateCategoryGroup = rt.Static<
  typeof listResponseTravelExpenseRateCategoryGroupRt
>;

const responseWrapperTravelCostCategoryRt = rt
  .Record({ value: travelCostCategoryRt })
  .asPartial();

type ResponseWrapperTravelCostCategory = rt.Static<
  typeof responseWrapperTravelCostCategoryRt
>;

const listResponseTravelCostCategoryRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(travelCostCategoryRt),
  })
  .asPartial();

type ListResponseTravelCostCategory = rt.Static<
  typeof listResponseTravelCostCategoryRt
>;

const responseWrapperTravelPaymentTypeRt = rt
  .Record({ value: travelPaymentTypeRt })
  .asPartial();

type ResponseWrapperTravelPaymentType = rt.Static<
  typeof responseWrapperTravelPaymentTypeRt
>;

const listResponseTravelPaymentTypeRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(travelPaymentTypeRt),
  })
  .asPartial();

type ListResponseTravelPaymentType = rt.Static<
  typeof listResponseTravelPaymentTypeRt
>;

const travelExpenseSettingsRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      useRates: rt.Boolean,
      approvalRequired: rt.Boolean,
      taxFreePerDiemRates: rt.Boolean,
      taxFreeMileageRates: rt.Boolean,
      perDiemNotCompensated: rt.Boolean,
      accommodationNotCompensated: rt.Boolean,
      mileageNotCompensated: rt.Boolean,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type TravelExpenseSettings = rt.Static<typeof travelExpenseSettingsRt>;

const responseWrapperTravelExpenseSettingsRt = rt
  .Record({ value: travelExpenseSettingsRt })
  .asPartial();

type ResponseWrapperTravelExpenseSettings = rt.Static<
  typeof responseWrapperTravelExpenseSettingsRt
>;

const travelExpenseZoneRt = rt.Intersect(
  rt.Record({ id: rt.Number, version: rt.Number }).asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      countryCode: rt.String,
      zoneName: rt.String,
      isDisabled: rt.Boolean,
      governmentName: rt.String,
      continent: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

type TravelExpenseZone = rt.Static<typeof travelExpenseZoneRt>;

const responseWrapperTravelExpenseZoneRt = rt
  .Record({ value: travelExpenseZoneRt })
  .asPartial();

type ResponseWrapperTravelExpenseZone = rt.Static<
  typeof responseWrapperTravelExpenseZoneRt
>;

const listResponseTravelExpenseZoneRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(travelExpenseZoneRt),
  })
  .asPartial();

type ListResponseTravelExpenseZone = rt.Static<
  typeof listResponseTravelExpenseZoneRt
>;

const tripletexAccountReturnRt = rt
  .Record({
    company: companyRt,
    administrator: employeeRt,
    administratorApiToken: employeeTokenRt,
    companyOwnedApiToken: employeeTokenRt,
    companyOwnedApiTokenRobotId: rt.Number,
  })
  .asPartial();

type TripletexAccountReturn = rt.Static<typeof tripletexAccountReturnRt>;

const responseWrapperTripletexAccountReturnRt = rt
  .Record({ value: tripletexAccountReturnRt })
  .asPartial();

type ResponseWrapperTripletexAccountReturn = rt.Static<
  typeof responseWrapperTripletexAccountReturnRt
>;

const tripletexAccountRt = rt
  .Record({
    company: companyRt,
    administrator: employeeRt,
    accountType: rt.Union(rt.Literal('TEST'), rt.Literal('PAYING')),
    modules: modulesRt,
    administratorPassword: rt.String,
    sendEmails: rt.Boolean,
    autoValidateUserLogin: rt.Boolean,
    createAdministratorApiToken: rt.Boolean,
    createCompanyOwnedApiToken: rt.Boolean,
    mayCreateTripletexAccounts: rt.Boolean,
    numberOfVouchers: rt.Union(
      rt.Literal('INTERVAL_0_100'),
      rt.Literal('INTERVAL_101_500'),
      rt.Literal('INTERVAL_0_500'),
      rt.Literal('INTERVAL_501_1000'),
      rt.Literal('INTERVAL_1001_2000'),
      rt.Literal('INTERVAL_2001_3500'),
      rt.Literal('INTERVAL_3501_5000'),
      rt.Literal('INTERVAL_5001_10000'),
      rt.Literal('INTERVAL_UNLIMITED'),
    ),
    chartOfAccountsType: rt.Union(
      rt.Literal('DEFAULT'),
      rt.Literal('MAMUT_STD_PAYROLL'),
      rt.Literal('MAMUT_NARF_PAYROLL'),
      rt.Literal('AGRO_FORRETNING_PAYROLL'),
      rt.Literal('AGRO_LANDBRUK_PAYROLL'),
      rt.Literal('AGRO_FISKE_PAYROLL'),
      rt.Literal('AGRO_FORSOKSRING_PAYROLL'),
      rt.Literal('AGRO_IDRETTSLAG_PAYROLL'),
      rt.Literal('AGRO_FORENING_PAYROLL'),
    ),
    accountingOffice: rt.Boolean,
    auditor: rt.Boolean,
    reseller: rt.Boolean,
  })
  .asPartial();

type TripletexAccount = rt.Static<typeof tripletexAccountRt>;

const tripletexAccount2Rt = rt
  .Record({
    company: companyRt,
    administrator: employeeRt,
    accountType: rt.Union(rt.Literal('TEST'), rt.Literal('PAYING')),
    modules: rt.Array(salesModuleDTORt),
    administratorPassword: rt.String,
    sendEmails: rt.Boolean,
    autoValidateUserLogin: rt.Boolean,
    createAdministratorApiToken: rt.Boolean,
    createCompanyOwnedApiToken: rt.Boolean,
    mayCreateTripletexAccounts: rt.Boolean,
    numberOfVouchers: rt.Union(
      rt.Literal('INTERVAL_0_100'),
      rt.Literal('INTERVAL_101_500'),
      rt.Literal('INTERVAL_0_500'),
      rt.Literal('INTERVAL_501_1000'),
      rt.Literal('INTERVAL_1001_2000'),
      rt.Literal('INTERVAL_2001_3500'),
      rt.Literal('INTERVAL_3501_5000'),
      rt.Literal('INTERVAL_5001_10000'),
      rt.Literal('INTERVAL_UNLIMITED'),
    ),
    chartOfAccountsType: rt.Union(
      rt.Literal('DEFAULT'),
      rt.Literal('MAMUT_STD_PAYROLL'),
      rt.Literal('MAMUT_NARF_PAYROLL'),
      rt.Literal('AGRO_FORRETNING_PAYROLL'),
      rt.Literal('AGRO_LANDBRUK_PAYROLL'),
      rt.Literal('AGRO_FISKE_PAYROLL'),
      rt.Literal('AGRO_FORSOKSRING_PAYROLL'),
      rt.Literal('AGRO_IDRETTSLAG_PAYROLL'),
      rt.Literal('AGRO_FORENING_PAYROLL'),
    ),
    vatStatusType: rt.Union(
      rt.Literal('VAT_REGISTERED'),
      rt.Literal('VAT_NOT_REGISTERED'),
      rt.Literal('VAT_APPLICANT'),
    ),
    bankAccount: rt.String,
    postAccount: rt.String,
    numberOfPrepaidUsers: rt.Number,
    accountingOffice: rt.Boolean,
    auditor: rt.Boolean,
    reseller: rt.Boolean,
  })
  .asPartial();

type TripletexAccount2 = rt.Static<typeof tripletexAccount2Rt>;

const customerTripletexAccountRt = rt
  .Record({
    administrator: employeeRt,
    customerId: rt.Number,
    accountType: rt.Union(rt.Literal('TEST'), rt.Literal('PAYING')),
    modules: modulesRt,
    type: rt.Union(
      rt.Literal('NONE'),
      rt.Literal('ENK'),
      rt.Literal('AS'),
      rt.Literal('NUF'),
      rt.Literal('ANS'),
      rt.Literal('DA'),
      rt.Literal('PRE'),
      rt.Literal('KS'),
      rt.Literal('ASA'),
      rt.Literal('BBL'),
      rt.Literal('BRL'),
      rt.Literal('GFS'),
      rt.Literal('SPA'),
      rt.Literal('SF'),
      rt.Literal('IKS'),
      rt.Literal('KF_FKF'),
      rt.Literal('FCD'),
      rt.Literal('EOFG'),
      rt.Literal('BA'),
      rt.Literal('STI'),
      rt.Literal('ORG'),
      rt.Literal('ESEK'),
      rt.Literal('SA'),
      rt.Literal('SAM'),
      rt.Literal('BO'),
      rt.Literal('VPFO'),
      rt.Literal('OS'),
      rt.Literal('Other'),
    ),
    sendEmails: rt.Boolean,
    autoValidateUserLogin: rt.Boolean,
    createApiToken: rt.Boolean,
    sendInvoiceToCustomer: rt.Boolean,
    customerInvoiceEmail: rt.String,
    numberOfEmployees: rt.Number,
    numberOfVouchers: rt.Union(
      rt.Literal('INTERVAL_0_100'),
      rt.Literal('INTERVAL_101_500'),
      rt.Literal('INTERVAL_0_500'),
      rt.Literal('INTERVAL_501_1000'),
      rt.Literal('INTERVAL_1001_2000'),
      rt.Literal('INTERVAL_2001_3500'),
      rt.Literal('INTERVAL_3501_5000'),
      rt.Literal('INTERVAL_5001_10000'),
      rt.Literal('INTERVAL_UNLIMITED'),
    ),
    administratorPassword: rt.String,
    chartOfAccountsType: rt.Union(
      rt.Literal('DEFAULT'),
      rt.Literal('MAMUT_STD_PAYROLL'),
      rt.Literal('MAMUT_NARF_PAYROLL'),
      rt.Literal('AGRO_FORRETNING_PAYROLL'),
      rt.Literal('AGRO_LANDBRUK_PAYROLL'),
      rt.Literal('AGRO_FISKE_PAYROLL'),
      rt.Literal('AGRO_FORSOKSRING_PAYROLL'),
      rt.Literal('AGRO_IDRETTSLAG_PAYROLL'),
      rt.Literal('AGRO_FORENING_PAYROLL'),
    ),
  })
  .asPartial();

type CustomerTripletexAccount = rt.Static<typeof customerTripletexAccountRt>;

const customerTripletexAccount2Rt = rt
  .Record({
    administrator: employeeRt,
    customerId: rt.Number,
    accountType: rt.Union(rt.Literal('TEST'), rt.Literal('PAYING')),
    modules: rt.Array(salesModuleDTORt),
    type: rt.Union(
      rt.Literal('NONE'),
      rt.Literal('ENK'),
      rt.Literal('AS'),
      rt.Literal('NUF'),
      rt.Literal('ANS'),
      rt.Literal('DA'),
      rt.Literal('PRE'),
      rt.Literal('KS'),
      rt.Literal('ASA'),
      rt.Literal('BBL'),
      rt.Literal('BRL'),
      rt.Literal('GFS'),
      rt.Literal('SPA'),
      rt.Literal('SF'),
      rt.Literal('IKS'),
      rt.Literal('KF_FKF'),
      rt.Literal('FCD'),
      rt.Literal('EOFG'),
      rt.Literal('BA'),
      rt.Literal('STI'),
      rt.Literal('ORG'),
      rt.Literal('ESEK'),
      rt.Literal('SA'),
      rt.Literal('SAM'),
      rt.Literal('BO'),
      rt.Literal('VPFO'),
      rt.Literal('OS'),
      rt.Literal('Other'),
    ),
    sendEmails: rt.Boolean,
    autoValidateUserLogin: rt.Boolean,
    createApiToken: rt.Boolean,
    sendInvoiceToCustomer: rt.Boolean,
    customerInvoiceEmail: rt.String,
    numberOfEmployees: rt.Number,
    administratorPassword: rt.String,
    chartOfAccountsType: rt.Union(
      rt.Literal('DEFAULT'),
      rt.Literal('MAMUT_STD_PAYROLL'),
      rt.Literal('MAMUT_NARF_PAYROLL'),
      rt.Literal('AGRO_FORRETNING_PAYROLL'),
      rt.Literal('AGRO_LANDBRUK_PAYROLL'),
      rt.Literal('AGRO_FISKE_PAYROLL'),
      rt.Literal('AGRO_FORSOKSRING_PAYROLL'),
      rt.Literal('AGRO_IDRETTSLAG_PAYROLL'),
      rt.Literal('AGRO_FORENING_PAYROLL'),
    ),
    vatStatusType: rt.Union(
      rt.Literal('VAT_REGISTERED'),
      rt.Literal('VAT_NOT_REGISTERED'),
      rt.Literal('VAT_APPLICANT'),
    ),
  })
  .asPartial();

type CustomerTripletexAccount2 = rt.Static<typeof customerTripletexAccount2Rt>;

const tripletexCompanyModulesRt = rt.Intersect(
  rt.Record({ id: rt.Number, version: rt.Number }).asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      companyId: rt.Number,
      modulehourlist: rt.Boolean,
      moduleTravelExpense: rt.Boolean,
      moduleInvoice: rt.Boolean,
      moduleaccountinginternal: rt.Boolean,
      moduleAccountingExternal: rt.Boolean,
      moduleproject: rt.Boolean,
      moduleproduct: rt.Boolean,
      modulecustomer: rt.Boolean,
      moduleemployee: rt.Boolean,
      moduledepartment: rt.Boolean,
      approveinvoices: rt.Boolean,
      approvehourlists: rt.Boolean,
      approvetravelreports: rt.Boolean,
      modulebudget: rt.Boolean,
      modulenote: rt.Boolean,
      moduletask: rt.Boolean,
      moduleresourceallocation: rt.Boolean,
      moduleprojecteconomy: rt.Boolean,
      modulereferencefee: rt.Boolean,
      modulehistorical: rt.Boolean,
      moduleprojectcategory: rt.Boolean,
      moduleprojectlocation: rt.Boolean,
      moduleProjectBudget: rt.Boolean,
      modulesubscription: rt.Boolean,
      completeweeklyhourlists: rt.Boolean,
      completemonthlyhourlists: rt.Boolean,
      approvemonthlyhourlists: rt.Boolean,
      moduleprojectprognosis: rt.Boolean,
      modulebunches: rt.Boolean,
      moduleVacationBalance: rt.Boolean,
      moduleAccountingReports: rt.Boolean,
      moduleCustomerCategories: rt.Boolean,
      moduleCustomerCategory1: rt.Boolean,
      moduleCustomerCategory2: rt.Boolean,
      moduleCustomerCategory3: rt.Boolean,
      moduleprojectsubcontract: rt.Boolean,
      modulePayrollAccounting: rt.Boolean,
      moduleTimeBalance: rt.Boolean,
      moduleWorkingHours: rt.Boolean,
      moduleCurrency: rt.Boolean,
      moduleWageExport: rt.Boolean,
      moduleAutoCustomerNumber: rt.Boolean,
      moduleAutoVendorNumber: rt.Boolean,
      moduleProvisionSalary: rt.Boolean,
      moduleOrderNumber: rt.Boolean,
      moduleOrderDiscount: rt.Boolean,
      moduleOrderMarkup: rt.Boolean,
      moduleOrderLineCost: rt.Boolean,
      moduleStopWatch: rt.Boolean,
      moduleContact: rt.Boolean,
      moduleAutoProjectNumber: rt.Boolean,
      moduleSwedish: rt.Boolean,
      moduleResourceGroups: rt.Boolean,
      moduleOcr: rt.Boolean,
      moduleTravelExpenseRates: rt.Boolean,
      monthlyHourlistMinusTimeWarning: rt.Boolean,
      moduleVoucherScanning: rt.Boolean,
      moduleInvoiceScanning: rt.Boolean,
      moduleProjectParticipants: rt.Boolean,
      moduleHolydayPlan: rt.Boolean,
      moduleEmployeeCategory: rt.Boolean,
      moduleProductInvoice: rt.Boolean,
      autoInvoicing: rt.Boolean,
      moduleInvoiceFeeComment: rt.Boolean,
      moduleEmployeeAccounting: rt.Boolean,
      moduleDepartmentAccounting: rt.Boolean,
      moduleProjectAccounting: rt.Boolean,
      moduleProductAccounting: rt.Boolean,
      moduleSubscriptionAddressList: rt.Boolean,
      moduleElectro: rt.Boolean,
      moduleNrf: rt.Boolean,
      moduleGtin: rt.Boolean,
      moduleElproffen: rt.Boolean,
      moduleRorkjop: rt.Boolean,
      moduleOrderExt: rt.Boolean,
      moduleResultBudget: rt.Boolean,
      moduleAmortization: rt.Boolean,
      moduleChangeDebtCollector: rt.Boolean,
      moduleVoucherTypes: rt.Boolean,
      moduleOnninen123: rt.Boolean,
      moduleElektroUnion: rt.Boolean,
      moduleAhlsellPartner: rt.Boolean,
      moduleArchive: rt.Boolean,
      moduleWarehouse: rt.Boolean,
      moduleProjectBudgetReferenceFee: rt.Boolean,
      moduleNetsEboks: rt.Boolean,
      moduleNetsPrintSalary: rt.Boolean,
      moduleNetsPrintInvoice: rt.Boolean,
      moduleInvoiceImport: rt.Boolean,
      moduleEmail: rt.Boolean,
      moduleOcrAutoPay: rt.Boolean,
      moduleEhf: rt.Boolean,
      moduleApproveVoucher: rt.Boolean,
      moduleApproveDepartmentVoucher: rt.Boolean,
      moduleApproveProjectVoucher: rt.Boolean,
      moduleOrderOut: rt.Boolean,
      moduleMesan: rt.Boolean,
      moduleDivisions: rt.Boolean,
      moduleBoligmappa: rt.Boolean,
      moduleAdditionProjectMarkup: rt.Boolean,
      moduleWageProjectAccounting: rt.Boolean,
      moduleAccountantConnectClient: rt.Boolean,
      moduleWageAmortization: rt.Boolean,
      moduleSubscriptionsPeriodisation: rt.Boolean,
      moduleActivityHourlyWageWageCode: rt.Boolean,
      moduleCRM: rt.Boolean,
      moduleApi20: rt.Boolean,
      moduleControlSchemaRequiredInvoicing: rt.Boolean,
      moduleControlSchemaRequiredHourTracking: rt.Boolean,
      moduleFinanceTax: rt.Boolean,
      modulePensionreport: rt.Boolean,
      moduleAgro: rt.Boolean,
      moduleMamut: rt.Boolean,
      moduleInvoiceOptionPaper: rt.Boolean,
      moduleSmartScan: rt.Boolean,
      moduleOffer: rt.Boolean,
      moduleAutoBankReconciliation: rt.Boolean,
      moduleVoucherAutomation: rt.Boolean,
      moduleEncryptedPaySlip: rt.Boolean,
      moduleInvoiceOptionVipps: rt.Boolean,
      moduleInvoiceOptionEfaktura: rt.Boolean,
      moduleInvoiceOptionAvtaleGiro: rt.Boolean,
      moduleFactoringAprila: rt.Boolean,
      moduleCashCreditAprila: rt.Boolean,
      moduleInvoiceOptionAutoinvoiceEhf: rt.Boolean,
    })
    .asPartial()
    .asReadonly(),
);

type TripletexCompanyModules = rt.Static<typeof tripletexCompanyModulesRt>;

const responseWrapperTripletexCompanyModulesRt = rt
  .Record({ value: tripletexCompanyModulesRt })
  .asPartial();

type ResponseWrapperTripletexCompanyModules = rt.Static<
  typeof responseWrapperTripletexCompanyModulesRt
>;

const listResponseTripletexCompanyModulesRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(tripletexCompanyModulesRt),
  })
  .asPartial();

type ListResponseTripletexCompanyModules = rt.Static<
  typeof listResponseTripletexCompanyModulesRt
>;

const tripletexAccountPricesReturnDTORt = rt
  .Record({
    allPrices: rt.Dictionary(rt.Unknown),
    sumStartupCategory1Users: tlxNumberRt,
    sumServiceCategory1Users: tlxNumberRt,
    listPriceCategory1UserStartup: tlxNumberRt,
    listPriceCategory1UserService: tlxNumberRt,
    sumStartup: tlxNumberRt,
    sumService: tlxNumberRt,
  })
  .asPartial();

type TripletexAccountPricesReturnDTO = rt.Static<
  typeof tripletexAccountPricesReturnDTORt
>;

const responseWrapperTripletexAccountPricesReturnDTORt = rt
  .Record({ value: tripletexAccountPricesReturnDTORt })
  .asPartial();

type ResponseWrapperTripletexAccountPricesReturnDTO = rt.Static<
  typeof responseWrapperTripletexAccountPricesReturnDTORt
>;

const salesForceAccountInfoRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      customerId: rt.Number,
      customerCompanyId: rt.Number,
      isReseller: rt.Boolean,
      isAccountant: rt.Boolean,
      isAuditor: rt.Boolean,
      isSuspended: rt.Boolean,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      registerDate: rt.String,
      startDate: rt.String,
      endDate: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

type SalesForceAccountInfo = rt.Static<typeof salesForceAccountInfoRt>;

const responseWrapperSalesForceAccountInfoRt = rt
  .Record({ value: salesForceAccountInfoRt })
  .asPartial();

type ResponseWrapperSalesForceAccountInfo = rt.Static<
  typeof responseWrapperSalesForceAccountInfoRt
>;

const listResponseSalesForceAccountInfoRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(salesForceAccountInfoRt),
  })
  .asPartial();

type ListResponseSalesForceAccountInfo = rt.Static<
  typeof listResponseSalesForceAccountInfoRt
>;

const salesForceEmployeeRoleRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      companyId: rt.Number,
      employeeId: rt.Number,
      roleId: rt.Number,
      userId: rt.Number,
      tripletexCustomerId: rt.Number,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String })
    .asPartial()
    .asReadonly(),
);

type SalesForceEmployeeRole = rt.Static<typeof salesForceEmployeeRoleRt>;

const responseWrapperSalesForceEmployeeRoleRt = rt
  .Record({ value: salesForceEmployeeRoleRt })
  .asPartial();

type ResponseWrapperSalesForceEmployeeRole = rt.Static<
  typeof responseWrapperSalesForceEmployeeRoleRt
>;

const salesForceOpportunityRt = rt
  .Record({
    allPrices: rt.Dictionary(rt.Unknown),
    sumStartupCategory1Users: rt.Number,
    sumServiceCategory1Users: rt.Number,
    listPriceCategory1UserStartup: rt.Number,
    listPriceCategory1UserService: rt.Number,
    sumStartup: rt.Number,
    sumService: rt.Number,
    sumAdditionalServices: rt.Number,
    accountantStartupProvision: rt.Number,
    accountantMonthlyProvision: rt.Number,
    noOfUsersPrepaid: rt.Number,
    noOfUsersIncluded: rt.Number,
  })
  .asPartial();

type SalesForceOpportunity = rt.Static<typeof salesForceOpportunityRt>;

const responseWrapperSalesForceOpportunityRt = rt
  .Record({ value: salesForceOpportunityRt })
  .asPartial();

type ResponseWrapperSalesForceOpportunity = rt.Static<
  typeof responseWrapperSalesForceOpportunityRt
>;

const salesForceCountryRt = rt.Intersect(
  rt.Record({ id: rt.Number, version: rt.Number }).asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      name: rt.String,
      isoAlpha2Code: rt.String,
      isoAlpha3Code: rt.String,
      isoNumericCode: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

type SalesForceCountry = rt.Static<typeof salesForceCountryRt>;

const salesForceAddressRt = rt.Intersect(
  rt.Record({ id: rt.Number, version: rt.Number }).asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      addressLine1: rt.String,
      addressLine2: rt.String,
      postalCode: rt.String,
      city: rt.String,
      country: salesForceCountryRt,
    })
    .asPartial()
    .asReadonly(),
);

type SalesForceAddress = rt.Static<typeof salesForceAddressRt>;

const salesForceEmployeeRt = rt.Intersect(
  rt.Record({ id: rt.Number, version: rt.Number }).asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      firstName: rt.String,
      lastName: rt.String,
      email: rt.String,
      phoneNumberMobile: rt.String,
      phoneNumberHome: rt.String,
      phoneNumberWork: rt.String,
      userId: rt.Number,
      companyId: rt.Number,
      customerId: rt.Number,
      phoneNumberSmsCertified: rt.String,
      isUserAdministrator: rt.Boolean,
      isAccountAdministrator: rt.Boolean,
      allowLogin: rt.Boolean,
      isExternal: rt.Boolean,
      isTripletexCertified: rt.Boolean,
      isDefaultLogin: rt.Boolean,
      loginEndDate: rt.String,
      address: salesForceAddressRt,
    })
    .asPartial()
    .asReadonly(),
);

type SalesForceEmployee = rt.Static<typeof salesForceEmployeeRt>;

const responseWrapperSalesForceEmployeeRt = rt
  .Record({ value: salesForceEmployeeRt })
  .asPartial();

type ResponseWrapperSalesForceEmployee = rt.Static<
  typeof responseWrapperSalesForceEmployeeRt
>;

const listResponseSalesForceEmployeeRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(salesForceEmployeeRt),
  })
  .asPartial();

type ListResponseSalesForceEmployee = rt.Static<
  typeof listResponseSalesForceEmployeeRt
>;

const voucherMessageRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      voucherId: rt.Number,
      content: rt.String,
      sendTime: rt.String,
    })
    .asPartial(),
  rt
    .Record({ changes: rt.Array(changeRt), url: rt.String, sender: employeeRt })
    .asPartial()
    .asReadonly(),
);

type VoucherMessage = rt.Static<typeof voucherMessageRt>;

const responseWrapperVoucherMessageRt = rt
  .Record({ value: voucherMessageRt })
  .asPartial();

type ResponseWrapperVoucherMessage = rt.Static<
  typeof responseWrapperVoucherMessageRt
>;

const listResponseVoucherMessageRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(voucherMessageRt),
  })
  .asPartial();

type ListResponseVoucherMessage = rt.Static<
  typeof listResponseVoucherMessageRt
>;

const voucherStatusRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      version: rt.Number,
      voucher: voucherRt,
      status: rt.Union(
        rt.Literal('WAITING'),
        rt.Literal('DONE'),
        rt.Literal('SKIPPED'),
        rt.Literal('ERROR'),
        rt.Literal('NONE'),
        rt.Literal('PROCESSING'),
        rt.Literal('RECLAIMED'),
      ),
      message: rt.Union(
        rt.Literal('NONE'),
        rt.Literal('ONGOING'),
        rt.Literal('NEEDS_APPROVAL'),
        rt.Literal('WITHDRAWN'),
        rt.Literal('SETTLED'),
      ),
      externalObjectUrl: rt.String,
      comment: rt.String,
      referenceNumber: rt.String,
    })
    .asPartial(),
  rt
    .Record({
      changes: rt.Array(changeRt),
      url: rt.String,
      type: rt.Union(
        rt.Literal('TRIPLETEX'),
        rt.Literal('SUPPLIERINVOICE_EXTERNAL'),
        rt.Literal('DEBT_COLLECTION'),
      ),
      timestamp: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

type VoucherStatus = rt.Static<typeof voucherStatusRt>;

const responseWrapperVoucherStatusRt = rt
  .Record({ value: voucherStatusRt })
  .asPartial();

type ResponseWrapperVoucherStatus = rt.Static<
  typeof responseWrapperVoucherStatusRt
>;

const listResponseVoucherStatusRt = rt
  .Record({
    fullResultSize: rt.Number,
    from: rt.Number,
    count: rt.Number,
    versionDigest: rt.String,
    values: rt.Array(voucherStatusRt),
  })
  .asPartial();

type ListResponseVoucherStatus = rt.Static<typeof listResponseVoucherStatusRt>;

// Operation: Activity_search

const activity_searchArgsRt = rt
  .Record({
    id: rt.String,
    name: rt.String,
    number: rt.String,
    description: rt.String,
    isProjectActivity: rt.Boolean,
    isGeneral: rt.Boolean,
    isChargeable: rt.Boolean,
    isTask: rt.Boolean,
    isInactive: rt.Boolean,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Activity_search
 * `GET: /activity`
 */
export const Activity_search = buildCall() //
  .args<rt.Static<typeof activity_searchArgsRt>>()
  .method('get')
  .path('/activity')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'name',
          'number',
          'description',
          'isProjectActivity',
          'isGeneral',
          'isChargeable',
          'isTask',
          'isInactive',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: Activity_post

const activity_postArgsRt = rt
  .Record({ body: activityRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Activity_post
 * `POST: /activity`
 */
export const Activity_post = buildCall() //
  .args<rt.Static<typeof activity_postArgsRt>>()
  .method('post')
  .path('/activity')
  .body((args) => args.body)
  .build();

// Operation: ActivityList_postList

const activityList_postListArgsRt = rt
  .Record({ body: rt.Array(activityRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ActivityList_postList
 * `POST: /activity/list`
 */
export const ActivityList_postList = buildCall() //
  .args<rt.Static<typeof activityList_postListArgsRt>>()
  .method('post')
  .path('/activity/list')
  .body((args) => args.body)
  .build();

// Operation: ActivityForTimeSheet_getForTimeSheet

const activityForTimeSheet_getForTimeSheetArgsRt = rt.Intersect(
  rt.Record({ projectId: rt.Number }).asReadonly(),
  rt
    .Record({
      employeeId: rt.Number,
      date: rt.String,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: ActivityForTimeSheet_getForTimeSheet
 * `GET: /activity/>forTimeSheet`
 */
export const ActivityForTimeSheet_getForTimeSheet = buildCall() //
  .args<rt.Static<typeof activityForTimeSheet_getForTimeSheetArgsRt>>()
  .method('get')
  .path('/activity/>forTimeSheet')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'projectId',
          'employeeId',
          'date',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: Activity_get

const activity_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: Activity_get
 * `GET: /activity/{id}`
 */
export const Activity_get = buildCall() //
  .args<rt.Static<typeof activity_getArgsRt>>()
  .method('get')
  .path((args) => `/activity/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: DeliveryAddress_get

const deliveryAddress_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: DeliveryAddress_get
 * `GET: /deliveryAddress/{id}`
 */
export const DeliveryAddress_get = buildCall() //
  .args<rt.Static<typeof deliveryAddress_getArgsRt>>()
  .method('get')
  .path((args) => `/deliveryAddress/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: DeliveryAddress_put

const deliveryAddress_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: deliveryAddressRt }).asPartial().asReadonly(),
);

/**
 * operation ID: DeliveryAddress_put
 * `PUT: /deliveryAddress/{id}`
 */
export const DeliveryAddress_put = buildCall() //
  .args<rt.Static<typeof deliveryAddress_putArgsRt>>()
  .method('put')
  .path((args) => `/deliveryAddress/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: DeliveryAddress_search

const deliveryAddress_searchArgsRt = rt
  .Record({
    id: rt.String,
    addressLine1: rt.String,
    addressLine2: rt.String,
    postalCode: rt.String,
    city: rt.String,
    name: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: DeliveryAddress_search
 * `GET: /deliveryAddress`
 */
export const DeliveryAddress_search = buildCall() //
  .args<rt.Static<typeof deliveryAddress_searchArgsRt>>()
  .method('get')
  .path('/deliveryAddress')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'addressLine1',
          'addressLine2',
          'postalCode',
          'city',
          'name',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: Asset_search

const asset_searchArgsRt = rt
  .Record({
    id: rt.String,
    name: rt.String,
    description: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Asset_search
 * `GET: /asset`
 */
export const Asset_search = buildCall() //
  .args<rt.Static<typeof asset_searchArgsRt>>()
  .method('get')
  .path('/asset')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'name',
          'description',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: Asset_post

const asset_postArgsRt = rt.Record({ body: assetRt }).asPartial().asReadonly();

/**
 * operation ID: Asset_post
 * `POST: /asset`
 */
export const Asset_post = buildCall() //
  .args<rt.Static<typeof asset_postArgsRt>>()
  .method('post')
  .path('/asset')
  .body((args) => args.body)
  .build();

// Operation: AssetList_postList

const assetList_postListArgsRt = rt
  .Record({ body: rt.Array(assetRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: AssetList_postList
 * `POST: /asset/list`
 */
export const AssetList_postList = buildCall() //
  .args<rt.Static<typeof assetList_postListArgsRt>>()
  .method('post')
  .path('/asset/list')
  .body((args) => args.body)
  .build();

// Operation: Asset_get

const asset_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: Asset_get
 * `GET: /asset/{id}`
 */
export const Asset_get = buildCall() //
  .args<rt.Static<typeof asset_getArgsRt>>()
  .method('get')
  .path((args) => `/asset/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: Asset_put

const asset_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: assetRt }).asPartial().asReadonly(),
);

/**
 * operation ID: Asset_put
 * `PUT: /asset/{id}`
 */
export const Asset_put = buildCall() //
  .args<rt.Static<typeof asset_putArgsRt>>()
  .method('put')
  .path((args) => `/asset/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: Asset_delete

const asset_deleteArgsRt = rt.Record({ id: rt.Number }).asReadonly();

/**
 * operation ID: Asset_delete
 * `DELETE: /asset/{id}`
 */
export const Asset_delete = buildCall() //
  .args<rt.Static<typeof asset_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/asset/${args.id}`)
  .build();

// Operation: BalanceSheet_search

const balanceSheet_searchArgsRt = rt.Intersect(
  rt.Record({ dateFrom: rt.String, dateTo: rt.String }).asReadonly(),
  rt
    .Record({
      accountNumberFrom: rt.Number,
      accountNumberTo: rt.Number,
      customerId: rt.Number,
      employeeId: rt.Number,
      departmentId: rt.Number,
      projectId: rt.Number,
      includeSubProjects: rt.Boolean,
      includeActiveAccountsWithoutMovements: rt.Boolean,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: BalanceSheet_search
 * `GET: /balanceSheet`
 */
export const BalanceSheet_search = buildCall() //
  .args<rt.Static<typeof balanceSheet_searchArgsRt>>()
  .method('get')
  .path('/balanceSheet')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'dateFrom',
          'dateTo',
          'accountNumberFrom',
          'accountNumberTo',
          'customerId',
          'employeeId',
          'departmentId',
          'projectId',
          'includeSubProjects',
          'includeActiveAccountsWithoutMovements',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: Bank_get

const bank_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: Bank_get
 * `GET: /bank/{id}`
 */
export const Bank_get = buildCall() //
  .args<rt.Static<typeof bank_getArgsRt>>()
  .method('get')
  .path((args) => `/bank/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: Bank_search

const bank_searchArgsRt = rt
  .Record({
    id: rt.String,
    registerNumbers: rt.String,
    isBankReconciliationSupport: rt.Boolean,
    isAutoPaySupported: rt.Boolean,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Bank_search
 * `GET: /bank`
 */
export const Bank_search = buildCall() //
  .args<rt.Static<typeof bank_searchArgsRt>>()
  .method('get')
  .path('/bank')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'registerNumbers',
          'isBankReconciliationSupport',
          'isAutoPaySupported',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: BankReconciliation_search

const bankReconciliation_searchArgsRt = rt
  .Record({
    id: rt.String,
    accountingPeriodId: rt.String,
    accountId: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: BankReconciliation_search
 * `GET: /bank/reconciliation`
 */
export const BankReconciliation_search = buildCall() //
  .args<rt.Static<typeof bankReconciliation_searchArgsRt>>()
  .method('get')
  .path('/bank/reconciliation')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'accountingPeriodId',
          'accountId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: BankReconciliation_post

const bankReconciliation_postArgsRt = rt
  .Record({ body: bankReconciliationRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: BankReconciliation_post
 * `POST: /bank/reconciliation`
 */
export const BankReconciliation_post = buildCall() //
  .args<rt.Static<typeof bankReconciliation_postArgsRt>>()
  .method('post')
  .path('/bank/reconciliation')
  .body((args) => args.body)
  .build();

// Operation: BankReconciliationLastClosed_lastClosed

const bankReconciliationLastClosed_lastClosedArgsRt = rt.Intersect(
  rt.Record({ accountId: rt.Number }).asReadonly(),
  rt.Record({ after: rt.String, fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: BankReconciliationLastClosed_lastClosed
 * `GET: /bank/reconciliation/>lastClosed`
 */
export const BankReconciliationLastClosed_lastClosed = buildCall() //
  .args<rt.Static<typeof bankReconciliationLastClosed_lastClosedArgsRt>>()
  .method('get')
  .path('/bank/reconciliation/>lastClosed')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'accountId', 'after', 'fields'),
      ),
  )
  .build();

// Operation: BankReconciliation_get

const bankReconciliation_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: BankReconciliation_get
 * `GET: /bank/reconciliation/{id}`
 */
export const BankReconciliation_get = buildCall() //
  .args<rt.Static<typeof bankReconciliation_getArgsRt>>()
  .method('get')
  .path((args) => `/bank/reconciliation/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: BankReconciliation_put

const bankReconciliation_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: bankReconciliationRt }).asPartial().asReadonly(),
);

/**
 * operation ID: BankReconciliation_put
 * `PUT: /bank/reconciliation/{id}`
 */
export const BankReconciliation_put = buildCall() //
  .args<rt.Static<typeof bankReconciliation_putArgsRt>>()
  .method('put')
  .path((args) => `/bank/reconciliation/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: BankReconciliation_delete

const bankReconciliation_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: BankReconciliation_delete
 * `DELETE: /bank/reconciliation/{id}`
 */
export const BankReconciliation_delete = buildCall() //
  .args<rt.Static<typeof bankReconciliation_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/bank/reconciliation/${args.id}`)
  .build();

// Operation: BankReconciliationAdjustment_adjustment

const bankReconciliationAdjustment_adjustmentArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt
    .Record({ body: rt.Array(bankReconciliationAdjustmentRt) })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: BankReconciliationAdjustment_adjustment
 * `PUT: /bank/reconciliation/{id}/:adjustment`
 */
export const BankReconciliationAdjustment_adjustment = buildCall() //
  .args<rt.Static<typeof bankReconciliationAdjustment_adjustmentArgsRt>>()
  .method('put')
  .path((args) => `/bank/reconciliation/${args.id}/:adjustment`)
  .body((args) => args.body)
  .build();

// Operation: BankReconciliationMatch_search

const bankReconciliationMatch_searchArgsRt = rt
  .Record({
    id: rt.String,
    bankReconciliationId: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: BankReconciliationMatch_search
 * `GET: /bank/reconciliation/match`
 */
export const BankReconciliationMatch_search = buildCall() //
  .args<rt.Static<typeof bankReconciliationMatch_searchArgsRt>>()
  .method('get')
  .path('/bank/reconciliation/match')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'bankReconciliationId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: BankReconciliationMatch_post

const bankReconciliationMatch_postArgsRt = rt
  .Record({ body: bankReconciliationMatchRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: BankReconciliationMatch_post
 * `POST: /bank/reconciliation/match`
 */
export const BankReconciliationMatch_post = buildCall() //
  .args<rt.Static<typeof bankReconciliationMatch_postArgsRt>>()
  .method('post')
  .path('/bank/reconciliation/match')
  .body((args) => args.body)
  .build();

// Operation: BankReconciliationMatchSuggest_suggest

const bankReconciliationMatchSuggest_suggestArgsRt = rt
  .Record({ bankReconciliationId: rt.Number })
  .asReadonly();

/**
 * operation ID: BankReconciliationMatchSuggest_suggest
 * `PUT: /bank/reconciliation/match/:suggest`
 */
export const BankReconciliationMatchSuggest_suggest = buildCall() //
  .args<rt.Static<typeof bankReconciliationMatchSuggest_suggestArgsRt>>()
  .method('put')
  .path('/bank/reconciliation/match/:suggest')
  .query(
    (args) =>
      new URLSearchParams(pickQueryValues(args, 'bankReconciliationId')),
  )
  .build();

// Operation: BankReconciliationMatch_get

const bankReconciliationMatch_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: BankReconciliationMatch_get
 * `GET: /bank/reconciliation/match/{id}`
 */
export const BankReconciliationMatch_get = buildCall() //
  .args<rt.Static<typeof bankReconciliationMatch_getArgsRt>>()
  .method('get')
  .path((args) => `/bank/reconciliation/match/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: BankReconciliationMatch_put

const bankReconciliationMatch_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: bankReconciliationMatchRt }).asPartial().asReadonly(),
);

/**
 * operation ID: BankReconciliationMatch_put
 * `PUT: /bank/reconciliation/match/{id}`
 */
export const BankReconciliationMatch_put = buildCall() //
  .args<rt.Static<typeof bankReconciliationMatch_putArgsRt>>()
  .method('put')
  .path((args) => `/bank/reconciliation/match/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: BankReconciliationMatch_delete

const bankReconciliationMatch_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: BankReconciliationMatch_delete
 * `DELETE: /bank/reconciliation/match/{id}`
 */
export const BankReconciliationMatch_delete = buildCall() //
  .args<rt.Static<typeof bankReconciliationMatch_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/bank/reconciliation/match/${args.id}`)
  .build();

// Operation: BankReconciliationPaymentType_get

const bankReconciliationPaymentType_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: BankReconciliationPaymentType_get
 * `GET: /bank/reconciliation/paymentType/{id}`
 */
export const BankReconciliationPaymentType_get = buildCall() //
  .args<rt.Static<typeof bankReconciliationPaymentType_getArgsRt>>()
  .method('get')
  .path((args) => `/bank/reconciliation/paymentType/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: BankReconciliationPaymentType_search

const bankReconciliationPaymentType_searchArgsRt = rt
  .Record({
    id: rt.String,
    description: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: BankReconciliationPaymentType_search
 * `GET: /bank/reconciliation/paymentType`
 */
export const BankReconciliationPaymentType_search = buildCall() //
  .args<rt.Static<typeof bankReconciliationPaymentType_searchArgsRt>>()
  .method('get')
  .path('/bank/reconciliation/paymentType')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'description',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: BankStatementImport_importBankStatement

const bankStatementImport_importBankStatementArgsRt = rt.Intersect(
  rt
    .Record({
      bankId: rt.Number,
      accountId: rt.Number,
      fromDate: rt.String,
      toDate: rt.String,
      fileFormat: rt.Union(
        rt.Literal('DNB_CSV'),
        rt.Literal('EIKA_TELEPAY'),
        rt.Literal('SPAREBANK1_TELEPAY'),
        rt.Literal('VISMA_ACCOUNT_STATEMENT'),
        rt.Literal('HANDELSBANKEN_TELEPAY'),
        rt.Literal('SPAREBANKEN_VEST_TELEPAY'),
        rt.Literal('NORDEA_CSV'),
        rt.Literal('TRANSFERWISE'),
        rt.Literal('SPAREBANKEN_SOR_TELEPAY'),
        rt.Literal('SPAREBANKEN_OST_TELEPAY'),
        rt.Literal('DANSKE_BANK_CSV'),
        rt.Literal('CULTURA_BANK_TELEPAY'),
        rt.Literal('SBANKEN_PRIVAT_CSV'),
        rt.Literal('HAUGESUND_SPAREBANK_CSV'),
      ),
      file: rt.Unknown,
    })
    .asReadonly(),
  rt.Record({ externalId: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: BankStatementImport_importBankStatement
 * `POST: /bank/statement/import`
 */
export const BankStatementImport_importBankStatement = buildCall() //
  .args<rt.Static<typeof bankStatementImport_importBankStatementArgsRt>>()
  .method('post')
  .path('/bank/statement/import')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'bankId',
          'accountId',
          'fromDate',
          'toDate',
          'externalId',
          'fileFormat',
        ),
      ),
  )
  .build();

// Operation: BankStatement_get

const bankStatement_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: BankStatement_get
 * `GET: /bank/statement/{id}`
 */
export const BankStatement_get = buildCall() //
  .args<rt.Static<typeof bankStatement_getArgsRt>>()
  .method('get')
  .path((args) => `/bank/statement/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: BankStatement_delete

const bankStatement_deleteArgsRt = rt.Record({ id: rt.Number }).asReadonly();

/**
 * operation ID: BankStatement_delete
 * `DELETE: /bank/statement/{id}`
 */
export const BankStatement_delete = buildCall() //
  .args<rt.Static<typeof bankStatement_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/bank/statement/${args.id}`)
  .build();

// Operation: BankStatement_search

const bankStatement_searchArgsRt = rt
  .Record({
    id: rt.String,
    accountId: rt.String,
    fileFormat: rt.Union(
      rt.Literal('DNB_CSV'),
      rt.Literal('EIKA_TELEPAY'),
      rt.Literal('SPAREBANK1_TELEPAY'),
      rt.Literal('VISMA_ACCOUNT_STATEMENT'),
      rt.Literal('HANDELSBANKEN_TELEPAY'),
      rt.Literal('SPAREBANKEN_VEST_TELEPAY'),
      rt.Literal('NORDEA_CSV'),
      rt.Literal('TRANSFERWISE'),
      rt.Literal('SPAREBANKEN_SOR_TELEPAY'),
      rt.Literal('SPAREBANKEN_OST_TELEPAY'),
      rt.Literal('DANSKE_BANK_CSV'),
      rt.Literal('CULTURA_BANK_TELEPAY'),
      rt.Literal('SBANKEN_PRIVAT_CSV'),
      rt.Literal('HAUGESUND_SPAREBANK_CSV'),
    ),
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: BankStatement_search
 * `GET: /bank/statement`
 */
export const BankStatement_search = buildCall() //
  .args<rt.Static<typeof bankStatement_searchArgsRt>>()
  .method('get')
  .path('/bank/statement')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'accountId',
          'fileFormat',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: BankStatementTransactionDetails_getDetails

const bankStatementTransactionDetails_getDetailsArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: BankStatementTransactionDetails_getDetails
 * `GET: /bank/statement/transaction/{id}/details`
 */
export const BankStatementTransactionDetails_getDetails = buildCall() //
  .args<rt.Static<typeof bankStatementTransactionDetails_getDetailsArgsRt>>()
  .method('get')
  .path((args) => `/bank/statement/transaction/${args.id}/details`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: BankStatementTransaction_get

const bankStatementTransaction_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: BankStatementTransaction_get
 * `GET: /bank/statement/transaction/{id}`
 */
export const BankStatementTransaction_get = buildCall() //
  .args<rt.Static<typeof bankStatementTransaction_getArgsRt>>()
  .method('get')
  .path((args) => `/bank/statement/transaction/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: BankStatementTransaction_search

const bankStatementTransaction_searchArgsRt = rt.Intersect(
  rt.Record({ bankStatementId: rt.Number }).asReadonly(),
  rt
    .Record({
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: BankStatementTransaction_search
 * `GET: /bank/statement/transaction`
 */
export const BankStatementTransaction_search = buildCall() //
  .args<rt.Static<typeof bankStatementTransaction_searchArgsRt>>()
  .method('get')
  .path('/bank/statement/transaction')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'bankStatementId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: TokenConsumerByToken_getByToken

const tokenConsumerByToken_getByTokenArgsRt = rt.Intersect(
  rt.Record({ token: rt.String }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: TokenConsumerByToken_getByToken
 * `GET: /token/consumer/byToken`
 */
export const TokenConsumerByToken_getByToken = buildCall() //
  .args<rt.Static<typeof tokenConsumerByToken_getByTokenArgsRt>>()
  .method('get')
  .path('/token/consumer/byToken')
  .query(
    (args) => new URLSearchParams(pickQueryValues(args, 'token', 'fields')),
  )
  .build();

// Operation: TokenEmployeeCreate_create

const tokenEmployeeCreate_createArgsRt = rt
  .Record({
    tokenName: rt.String,
    consumerName: rt.String,
    employeeId: rt.Number,
    companyOwned: rt.Boolean,
    expirationDate: rt.String,
  })
  .asReadonly();

/**
 * operation ID: TokenEmployeeCreate_create
 * `PUT: /token/employee/:create`
 */
export const TokenEmployeeCreate_create = buildCall() //
  .args<rt.Static<typeof tokenEmployeeCreate_createArgsRt>>()
  .method('put')
  .path('/token/employee/:create')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'tokenName',
          'consumerName',
          'employeeId',
          'companyOwned',
          'expirationDate',
        ),
      ),
  )
  .build();

// Operation: TokenSessionWhoAmI_whoAmI

const tokenSessionWhoAmI_whoAmIArgsRt = rt
  .Record({ fields: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TokenSessionWhoAmI_whoAmI
 * `GET: /token/session/>whoAmI`
 */
export const TokenSessionWhoAmI_whoAmI = buildCall() //
  .args<rt.Static<typeof tokenSessionWhoAmI_whoAmIArgsRt>>()
  .method('get')
  .path('/token/session/>whoAmI')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TokenSession_delete

const tokenSession_deleteArgsRt = rt.Record({ token: rt.String }).asReadonly();

/**
 * operation ID: TokenSession_delete
 * `DELETE: /token/session/{token}`
 */
export const TokenSession_delete = buildCall() //
  .args<rt.Static<typeof tokenSession_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/token/session/${args.token}`)
  .build();

// Operation: TokenSessionCreate_create

const tokenSessionCreate_createArgsRt = rt
  .Record({
    consumerToken: rt.String,
    employeeToken: rt.String,
    expirationDate: rt.String,
  })
  .asReadonly();

/**
 * operation ID: TokenSessionCreate_create
 * `PUT: /token/session/:create`
 */
export const TokenSessionCreate_create = buildCall() //
  .args<rt.Static<typeof tokenSessionCreate_createArgsRt>>()
  .method('put')
  .path('/token/session/:create')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'consumerToken',
          'employeeToken',
          'expirationDate',
        ),
      ),
  )
  .build();

// Operation: CompanyWithLoginAccess_getWithLoginAccess

const companyWithLoginAccess_getWithLoginAccessArgsRt = rt
  .Record({
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: CompanyWithLoginAccess_getWithLoginAccess
 * `GET: /company/>withLoginAccess`
 */
export const CompanyWithLoginAccess_getWithLoginAccess = buildCall() //
  .args<rt.Static<typeof companyWithLoginAccess_getWithLoginAccessArgsRt>>()
  .method('get')
  .path('/company/>withLoginAccess')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'from', 'count', 'sorting', 'fields'),
      ),
  )
  .build();

// Operation: CompanyDivisions_getDivisions

const companyDivisions_getDivisionsArgsRt = rt
  .Record({
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: CompanyDivisions_getDivisions
 * `GET: /company/divisions`
 */
export const CompanyDivisions_getDivisions = buildCall() //
  .args<rt.Static<typeof companyDivisions_getDivisionsArgsRt>>()
  .method('get')
  .path('/company/divisions')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'from', 'count', 'sorting', 'fields'),
      ),
  )
  .build();

// Operation: Company_get

const company_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: Company_get
 * `GET: /company/{id}`
 */
export const Company_get = buildCall() //
  .args<rt.Static<typeof company_getArgsRt>>()
  .method('get')
  .path((args) => `/company/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: Company_put

const company_putArgsRt = rt
  .Record({ body: companyRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Company_put
 * `PUT: /company`
 */
export const Company_put = buildCall() //
  .args<rt.Static<typeof company_putArgsRt>>()
  .method('put')
  .path('/company')
  .body((args) => args.body)
  .build();

// Operation: CompanySettingsAltinn_search

const companySettingsAltinn_searchArgsRt = rt
  .Record({ fields: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: CompanySettingsAltinn_search
 * `GET: /company/settings/altinn`
 */
export const CompanySettingsAltinn_search = buildCall() //
  .args<rt.Static<typeof companySettingsAltinn_searchArgsRt>>()
  .method('get')
  .path('/company/settings/altinn')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: CompanySettingsAltinn_put

const companySettingsAltinn_putArgsRt = rt
  .Record({ body: altinnCompanyModuleRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: CompanySettingsAltinn_put
 * `PUT: /company/settings/altinn`
 */
export const CompanySettingsAltinn_put = buildCall() //
  .args<rt.Static<typeof companySettingsAltinn_putArgsRt>>()
  .method('put')
  .path('/company/settings/altinn')
  .body((args) => args.body)
  .build();

// Operation: CompanySalesmodules_get

const companySalesmodules_getArgsRt = rt
  .Record({
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: CompanySalesmodules_get
 * `GET: /company/salesmodules`
 */
export const CompanySalesmodules_get = buildCall() //
  .args<rt.Static<typeof companySalesmodules_getArgsRt>>()
  .method('get')
  .path('/company/salesmodules')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'from', 'count', 'sorting', 'fields'),
      ),
  )
  .build();

// Operation: CompanySalesmodules_post

const companySalesmodules_postArgsRt = rt
  .Record({ body: salesModuleDTORt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: CompanySalesmodules_post
 * `POST: /company/salesmodules`
 */
export const CompanySalesmodules_post = buildCall() //
  .args<rt.Static<typeof companySalesmodules_postArgsRt>>()
  .method('post')
  .path('/company/salesmodules')
  .body((args) => args.body)
  .build();

// Operation: Contact_search

const contact_searchArgsRt = rt
  .Record({
    id: rt.String,
    firstName: rt.String,
    lastName: rt.String,
    email: rt.String,
    customerId: rt.String,
    departmentId: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Contact_search
 * `GET: /contact`
 */
export const Contact_search = buildCall() //
  .args<rt.Static<typeof contact_searchArgsRt>>()
  .method('get')
  .path('/contact')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'firstName',
          'lastName',
          'email',
          'customerId',
          'departmentId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: Contact_post

const contact_postArgsRt = rt
  .Record({ body: contactRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Contact_post
 * `POST: /contact`
 */
export const Contact_post = buildCall() //
  .args<rt.Static<typeof contact_postArgsRt>>()
  .method('post')
  .path('/contact')
  .body((args) => args.body)
  .build();

// Operation: Contact_get

const contact_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: Contact_get
 * `GET: /contact/{id}`
 */
export const Contact_get = buildCall() //
  .args<rt.Static<typeof contact_getArgsRt>>()
  .method('get')
  .path((args) => `/contact/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: Contact_put

const contact_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: contactRt }).asPartial().asReadonly(),
);

/**
 * operation ID: Contact_put
 * `PUT: /contact/{id}`
 */
export const Contact_put = buildCall() //
  .args<rt.Static<typeof contact_putArgsRt>>()
  .method('put')
  .path((args) => `/contact/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: Country_get

const country_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: Country_get
 * `GET: /country/{id}`
 */
export const Country_get = buildCall() //
  .args<rt.Static<typeof country_getArgsRt>>()
  .method('get')
  .path((args) => `/country/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: Country_search

const country_searchArgsRt = rt
  .Record({
    id: rt.String,
    code: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Country_search
 * `GET: /country`
 */
export const Country_search = buildCall() //
  .args<rt.Static<typeof country_searchArgsRt>>()
  .method('get')
  .path('/country')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'code',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: Currency_get

const currency_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: Currency_get
 * `GET: /currency/{id}`
 */
export const Currency_get = buildCall() //
  .args<rt.Static<typeof currency_getArgsRt>>()
  .method('get')
  .path((args) => `/currency/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: Currency_search

const currency_searchArgsRt = rt
  .Record({
    id: rt.String,
    code: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Currency_search
 * `GET: /currency`
 */
export const Currency_search = buildCall() //
  .args<rt.Static<typeof currency_searchArgsRt>>()
  .method('get')
  .path('/currency')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'code',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: CurrencyRate_getRate

const currencyRate_getRateArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number, date: rt.String }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: CurrencyRate_getRate
 * `GET: /currency/{id}/rate`
 */
export const CurrencyRate_getRate = buildCall() //
  .args<rt.Static<typeof currencyRate_getRateArgsRt>>()
  .method('get')
  .path((args) => `/currency/${args.id}/rate`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'date', 'fields')))
  .build();

// Operation: Customer_search

const customer_searchArgsRt = rt
  .Record({
    id: rt.String,
    customerAccountNumber: rt.String,
    organizationNumber: rt.String,
    email: rt.String,
    invoiceEmail: rt.String,
    isInactive: rt.Boolean,
    accountManagerId: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Customer_search
 * `GET: /customer`
 */
export const Customer_search = buildCall() //
  .args<rt.Static<typeof customer_searchArgsRt>>()
  .method('get')
  .path('/customer')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'customerAccountNumber',
          'organizationNumber',
          'email',
          'invoiceEmail',
          'isInactive',
          'accountManagerId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: Customer_post

const customer_postArgsRt = rt
  .Record({ body: customerRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Customer_post
 * `POST: /customer`
 */
export const Customer_post = buildCall() //
  .args<rt.Static<typeof customer_postArgsRt>>()
  .method('post')
  .path('/customer')
  .body((args) => args.body)
  .build();

// Operation: CustomerList_putList

const customerList_putListArgsRt = rt
  .Record({ body: rt.Array(customerRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: CustomerList_putList
 * `PUT: /customer/list`
 */
export const CustomerList_putList = buildCall() //
  .args<rt.Static<typeof customerList_putListArgsRt>>()
  .method('put')
  .path('/customer/list')
  .body((args) => args.body)
  .build();

// Operation: CustomerList_postList

const customerList_postListArgsRt = rt
  .Record({ body: rt.Array(customerRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: CustomerList_postList
 * `POST: /customer/list`
 */
export const CustomerList_postList = buildCall() //
  .args<rt.Static<typeof customerList_postListArgsRt>>()
  .method('post')
  .path('/customer/list')
  .body((args) => args.body)
  .build();

// Operation: Customer_get

const customer_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: Customer_get
 * `GET: /customer/{id}`
 */
export const Customer_get = buildCall() //
  .args<rt.Static<typeof customer_getArgsRt>>()
  .method('get')
  .path((args) => `/customer/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: Customer_put

const customer_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: customerRt }).asPartial().asReadonly(),
);

/**
 * operation ID: Customer_put
 * `PUT: /customer/{id}`
 */
export const Customer_put = buildCall() //
  .args<rt.Static<typeof customer_putArgsRt>>()
  .method('put')
  .path((args) => `/customer/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: Customer_delete

const customer_deleteArgsRt = rt.Record({ id: rt.Number }).asReadonly();

/**
 * operation ID: Customer_delete
 * `DELETE: /customer/{id}`
 */
export const Customer_delete = buildCall() //
  .args<rt.Static<typeof customer_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/customer/${args.id}`)
  .build();

// Operation: CustomerCategory_search

const customerCategory_searchArgsRt = rt
  .Record({
    id: rt.String,
    name: rt.String,
    number: rt.String,
    description: rt.String,
    type: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: CustomerCategory_search
 * `GET: /customer/category`
 */
export const CustomerCategory_search = buildCall() //
  .args<rt.Static<typeof customerCategory_searchArgsRt>>()
  .method('get')
  .path('/customer/category')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'name',
          'number',
          'description',
          'type',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: CustomerCategory_post

const customerCategory_postArgsRt = rt
  .Record({ body: customerCategoryRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: CustomerCategory_post
 * `POST: /customer/category`
 */
export const CustomerCategory_post = buildCall() //
  .args<rt.Static<typeof customerCategory_postArgsRt>>()
  .method('post')
  .path('/customer/category')
  .body((args) => args.body)
  .build();

// Operation: CustomerCategory_get

const customerCategory_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: CustomerCategory_get
 * `GET: /customer/category/{id}`
 */
export const CustomerCategory_get = buildCall() //
  .args<rt.Static<typeof customerCategory_getArgsRt>>()
  .method('get')
  .path((args) => `/customer/category/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: CustomerCategory_put

const customerCategory_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: customerCategoryRt }).asPartial().asReadonly(),
);

/**
 * operation ID: CustomerCategory_put
 * `PUT: /customer/category/{id}`
 */
export const CustomerCategory_put = buildCall() //
  .args<rt.Static<typeof customerCategory_putArgsRt>>()
  .method('put')
  .path((args) => `/customer/category/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: Department_search

const department_searchArgsRt = rt
  .Record({
    id: rt.String,
    name: rt.String,
    departmentNumber: rt.String,
    departmentManagerId: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Department_search
 * `GET: /department`
 */
export const Department_search = buildCall() //
  .args<rt.Static<typeof department_searchArgsRt>>()
  .method('get')
  .path('/department')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'name',
          'departmentNumber',
          'departmentManagerId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: Department_post

const department_postArgsRt = rt
  .Record({ body: departmentRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Department_post
 * `POST: /department`
 */
export const Department_post = buildCall() //
  .args<rt.Static<typeof department_postArgsRt>>()
  .method('post')
  .path('/department')
  .body((args) => args.body)
  .build();

// Operation: DepartmentList_putList

const departmentList_putListArgsRt = rt
  .Record({ body: rt.Array(departmentRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: DepartmentList_putList
 * `PUT: /department/list`
 */
export const DepartmentList_putList = buildCall() //
  .args<rt.Static<typeof departmentList_putListArgsRt>>()
  .method('put')
  .path('/department/list')
  .body((args) => args.body)
  .build();

// Operation: DepartmentList_postList

const departmentList_postListArgsRt = rt
  .Record({ body: rt.Array(departmentRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: DepartmentList_postList
 * `POST: /department/list`
 */
export const DepartmentList_postList = buildCall() //
  .args<rt.Static<typeof departmentList_postListArgsRt>>()
  .method('post')
  .path('/department/list')
  .body((args) => args.body)
  .build();

// Operation: Department_get

const department_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: Department_get
 * `GET: /department/{id}`
 */
export const Department_get = buildCall() //
  .args<rt.Static<typeof department_getArgsRt>>()
  .method('get')
  .path((args) => `/department/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: Department_put

const department_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: departmentRt }).asPartial().asReadonly(),
);

/**
 * operation ID: Department_put
 * `PUT: /department/{id}`
 */
export const Department_put = buildCall() //
  .args<rt.Static<typeof department_putArgsRt>>()
  .method('put')
  .path((args) => `/department/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: Department_delete

const department_deleteArgsRt = rt.Record({ id: rt.Number }).asReadonly();

/**
 * operation ID: Department_delete
 * `DELETE: /department/{id}`
 */
export const Department_delete = buildCall() //
  .args<rt.Static<typeof department_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/department/${args.id}`)
  .build();

// Operation: Division_search

const division_searchArgsRt = rt
  .Record({
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Division_search
 * `GET: /division`
 */
export const Division_search = buildCall() //
  .args<rt.Static<typeof division_searchArgsRt>>()
  .method('get')
  .path('/division')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'from', 'count', 'sorting', 'fields'),
      ),
  )
  .build();

// Operation: Division_post

const division_postArgsRt = rt
  .Record({ body: divisionRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Division_post
 * `POST: /division`
 */
export const Division_post = buildCall() //
  .args<rt.Static<typeof division_postArgsRt>>()
  .method('post')
  .path('/division')
  .body((args) => args.body)
  .build();

// Operation: DivisionList_putList

const divisionList_putListArgsRt = rt
  .Record({ body: rt.Array(divisionRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: DivisionList_putList
 * `PUT: /division/list`
 */
export const DivisionList_putList = buildCall() //
  .args<rt.Static<typeof divisionList_putListArgsRt>>()
  .method('put')
  .path('/division/list')
  .body((args) => args.body)
  .build();

// Operation: DivisionList_postList

const divisionList_postListArgsRt = rt
  .Record({ body: rt.Array(divisionRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: DivisionList_postList
 * `POST: /division/list`
 */
export const DivisionList_postList = buildCall() //
  .args<rt.Static<typeof divisionList_postListArgsRt>>()
  .method('post')
  .path('/division/list')
  .body((args) => args.body)
  .build();

// Operation: Division_put

const division_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: divisionRt }).asPartial().asReadonly(),
);

/**
 * operation ID: Division_put
 * `PUT: /division/{id}`
 */
export const Division_put = buildCall() //
  .args<rt.Static<typeof division_putArgsRt>>()
  .method('put')
  .path((args) => `/division/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: DocumentContent_downloadContent

const documentContent_downloadContentArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: DocumentContent_downloadContent
 * `GET: /document/{id}/content`
 */
export const DocumentContent_downloadContent = buildCall() //
  .args<rt.Static<typeof documentContent_downloadContentArgsRt>>()
  .method('get')
  .path((args) => `/document/${args.id}/content`)
  .build();

// Operation: Document_get

const document_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: Document_get
 * `GET: /document/{id}`
 */
export const Document_get = buildCall() //
  .args<rt.Static<typeof document_getArgsRt>>()
  .method('get')
  .path((args) => `/document/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: DocumentArchiveReception_receptionPost

const documentArchiveReception_receptionPostArgsRt = rt
  .Record({ file: rt.Unknown })
  .asReadonly();

/**
 * operation ID: DocumentArchiveReception_receptionPost
 * `POST: /documentArchive/reception`
 */
export const DocumentArchiveReception_receptionPost = buildCall() //
  .args<rt.Static<typeof documentArchiveReception_receptionPostArgsRt>>()
  .method('post')
  .path('/documentArchive/reception')
  .build();

// Operation: DocumentArchiveCustomer_getCustomer

const documentArchiveCustomer_getCustomerArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt
    .Record({
      periodDateFrom: rt.String,
      periodDateTo: rt.String,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: DocumentArchiveCustomer_getCustomer
 * `GET: /documentArchive/customer/{id}`
 */
export const DocumentArchiveCustomer_getCustomer = buildCall() //
  .args<rt.Static<typeof documentArchiveCustomer_getCustomerArgsRt>>()
  .method('get')
  .path((args) => `/documentArchive/customer/${args.id}`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'periodDateFrom',
          'periodDateTo',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: DocumentArchiveCustomer_customerPost

const documentArchiveCustomer_customerPostArgsRt = rt
  .Record({ file: rt.Unknown, id: rt.Number })
  .asReadonly();

/**
 * operation ID: DocumentArchiveCustomer_customerPost
 * `POST: /documentArchive/customer/{id}`
 */
export const DocumentArchiveCustomer_customerPost = buildCall() //
  .args<rt.Static<typeof documentArchiveCustomer_customerPostArgsRt>>()
  .method('post')
  .path((args) => `/documentArchive/customer/${args.id}`)
  .build();

// Operation: DocumentArchiveProject_getProject

const documentArchiveProject_getProjectArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt
    .Record({
      periodDateFrom: rt.String,
      periodDateTo: rt.String,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: DocumentArchiveProject_getProject
 * `GET: /documentArchive/project/{id}`
 */
export const DocumentArchiveProject_getProject = buildCall() //
  .args<rt.Static<typeof documentArchiveProject_getProjectArgsRt>>()
  .method('get')
  .path((args) => `/documentArchive/project/${args.id}`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'periodDateFrom',
          'periodDateTo',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: DocumentArchiveProject_projectPost

const documentArchiveProject_projectPostArgsRt = rt
  .Record({ file: rt.Unknown, id: rt.Number })
  .asReadonly();

/**
 * operation ID: DocumentArchiveProject_projectPost
 * `POST: /documentArchive/project/{id}`
 */
export const DocumentArchiveProject_projectPost = buildCall() //
  .args<rt.Static<typeof documentArchiveProject_projectPostArgsRt>>()
  .method('post')
  .path((args) => `/documentArchive/project/${args.id}`)
  .build();

// Operation: DocumentArchiveSupplier_getSupplier

const documentArchiveSupplier_getSupplierArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt
    .Record({
      periodDateFrom: rt.String,
      periodDateTo: rt.String,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: DocumentArchiveSupplier_getSupplier
 * `GET: /documentArchive/supplier/{id}`
 */
export const DocumentArchiveSupplier_getSupplier = buildCall() //
  .args<rt.Static<typeof documentArchiveSupplier_getSupplierArgsRt>>()
  .method('get')
  .path((args) => `/documentArchive/supplier/${args.id}`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'periodDateFrom',
          'periodDateTo',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: DocumentArchiveSupplier_supplierPost

const documentArchiveSupplier_supplierPostArgsRt = rt
  .Record({ file: rt.Unknown, id: rt.Number })
  .asReadonly();

/**
 * operation ID: DocumentArchiveSupplier_supplierPost
 * `POST: /documentArchive/supplier/{id}`
 */
export const DocumentArchiveSupplier_supplierPost = buildCall() //
  .args<rt.Static<typeof documentArchiveSupplier_supplierPostArgsRt>>()
  .method('post')
  .path((args) => `/documentArchive/supplier/${args.id}`)
  .build();

// Operation: DocumentArchiveEmployee_getEmployee

const documentArchiveEmployee_getEmployeeArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt
    .Record({
      periodDateFrom: rt.String,
      periodDateTo: rt.String,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: DocumentArchiveEmployee_getEmployee
 * `GET: /documentArchive/employee/{id}`
 */
export const DocumentArchiveEmployee_getEmployee = buildCall() //
  .args<rt.Static<typeof documentArchiveEmployee_getEmployeeArgsRt>>()
  .method('get')
  .path((args) => `/documentArchive/employee/${args.id}`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'periodDateFrom',
          'periodDateTo',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: DocumentArchiveEmployee_employeePost

const documentArchiveEmployee_employeePostArgsRt = rt
  .Record({ file: rt.Unknown, id: rt.Number })
  .asReadonly();

/**
 * operation ID: DocumentArchiveEmployee_employeePost
 * `POST: /documentArchive/employee/{id}`
 */
export const DocumentArchiveEmployee_employeePost = buildCall() //
  .args<rt.Static<typeof documentArchiveEmployee_employeePostArgsRt>>()
  .method('post')
  .path((args) => `/documentArchive/employee/${args.id}`)
  .build();

// Operation: DocumentArchiveProduct_getProduct

const documentArchiveProduct_getProductArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt
    .Record({
      periodDateFrom: rt.String,
      periodDateTo: rt.String,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: DocumentArchiveProduct_getProduct
 * `GET: /documentArchive/product/{id}`
 */
export const DocumentArchiveProduct_getProduct = buildCall() //
  .args<rt.Static<typeof documentArchiveProduct_getProductArgsRt>>()
  .method('get')
  .path((args) => `/documentArchive/product/${args.id}`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'periodDateFrom',
          'periodDateTo',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: DocumentArchiveProduct_productPost

const documentArchiveProduct_productPostArgsRt = rt
  .Record({ file: rt.Unknown, id: rt.Number })
  .asReadonly();

/**
 * operation ID: DocumentArchiveProduct_productPost
 * `POST: /documentArchive/product/{id}`
 */
export const DocumentArchiveProduct_productPost = buildCall() //
  .args<rt.Static<typeof documentArchiveProduct_productPostArgsRt>>()
  .method('post')
  .path((args) => `/documentArchive/product/${args.id}`)
  .build();

// Operation: DocumentArchiveAccount_getAccount

const documentArchiveAccount_getAccountArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt
    .Record({
      periodDateFrom: rt.String,
      periodDateTo: rt.String,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: DocumentArchiveAccount_getAccount
 * `GET: /documentArchive/account/{id}`
 */
export const DocumentArchiveAccount_getAccount = buildCall() //
  .args<rt.Static<typeof documentArchiveAccount_getAccountArgsRt>>()
  .method('get')
  .path((args) => `/documentArchive/account/${args.id}`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'periodDateFrom',
          'periodDateTo',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: DocumentArchiveAccount_accountPost

const documentArchiveAccount_accountPostArgsRt = rt
  .Record({ file: rt.Unknown, id: rt.Number })
  .asReadonly();

/**
 * operation ID: DocumentArchiveAccount_accountPost
 * `POST: /documentArchive/account/{id}`
 */
export const DocumentArchiveAccount_accountPost = buildCall() //
  .args<rt.Static<typeof documentArchiveAccount_accountPostArgsRt>>()
  .method('post')
  .path((args) => `/documentArchive/account/${args.id}`)
  .build();

// Operation: DocumentArchiveProspect_getProspect

const documentArchiveProspect_getProspectArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt
    .Record({
      periodDateFrom: rt.String,
      periodDateTo: rt.String,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: DocumentArchiveProspect_getProspect
 * `GET: /documentArchive/prospect/{id}`
 */
export const DocumentArchiveProspect_getProspect = buildCall() //
  .args<rt.Static<typeof documentArchiveProspect_getProspectArgsRt>>()
  .method('get')
  .path((args) => `/documentArchive/prospect/${args.id}`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'periodDateFrom',
          'periodDateTo',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: DocumentArchiveProspect_prospectPost

const documentArchiveProspect_prospectPostArgsRt = rt
  .Record({ file: rt.Unknown, id: rt.Number })
  .asReadonly();

/**
 * operation ID: DocumentArchiveProspect_prospectPost
 * `POST: /documentArchive/prospect/{id}`
 */
export const DocumentArchiveProspect_prospectPost = buildCall() //
  .args<rt.Static<typeof documentArchiveProspect_prospectPostArgsRt>>()
  .method('post')
  .path((args) => `/documentArchive/prospect/${args.id}`)
  .build();

// Operation: DocumentArchive_put

const documentArchive_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: documentArchiveRt }).asPartial().asReadonly(),
);

/**
 * operation ID: DocumentArchive_put
 * `PUT: /documentArchive/{id}`
 */
export const DocumentArchive_put = buildCall() //
  .args<rt.Static<typeof documentArchive_putArgsRt>>()
  .method('put')
  .path((args) => `/documentArchive/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: DocumentArchive_delete

const documentArchive_deleteArgsRt = rt.Record({ id: rt.Number }).asReadonly();

/**
 * operation ID: DocumentArchive_delete
 * `DELETE: /documentArchive/{id}`
 */
export const DocumentArchive_delete = buildCall() //
  .args<rt.Static<typeof documentArchive_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/documentArchive/${args.id}`)
  .build();

// Operation: Employee_search

const employee_searchArgsRt = rt
  .Record({
    id: rt.String,
    firstName: rt.String,
    lastName: rt.String,
    employeeNumber: rt.String,
    allowInformationRegistration: rt.Boolean,
    includeContacts: rt.Boolean,
    departmentId: rt.String,
    onlyProjectManagers: rt.Boolean,
    assignableProjectManagers: rt.Boolean,
    periodStart: rt.String,
    periodEnd: rt.String,
    hasSystemAccess: rt.Boolean,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Employee_search
 * `GET: /employee`
 */
export const Employee_search = buildCall() //
  .args<rt.Static<typeof employee_searchArgsRt>>()
  .method('get')
  .path('/employee')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'firstName',
          'lastName',
          'employeeNumber',
          'allowInformationRegistration',
          'includeContacts',
          'departmentId',
          'onlyProjectManagers',
          'assignableProjectManagers',
          'periodStart',
          'periodEnd',
          'hasSystemAccess',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: Employee_post

const employee_postArgsRt = rt
  .Record({ body: employeeRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Employee_post
 * `POST: /employee`
 */
export const Employee_post = buildCall() //
  .args<rt.Static<typeof employee_postArgsRt>>()
  .method('post')
  .path('/employee')
  .body((args) => args.body)
  .build();

// Operation: EmployeeList_postList

const employeeList_postListArgsRt = rt
  .Record({ body: rt.Array(employeeRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeList_postList
 * `POST: /employee/list`
 */
export const EmployeeList_postList = buildCall() //
  .args<rt.Static<typeof employeeList_postListArgsRt>>()
  .method('post')
  .path('/employee/list')
  .body((args) => args.body)
  .build();

// Operation: Employee_get

const employee_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: Employee_get
 * `GET: /employee/{id}`
 */
export const Employee_get = buildCall() //
  .args<rt.Static<typeof employee_getArgsRt>>()
  .method('get')
  .path((args) => `/employee/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: Employee_put

const employee_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: employeeRt }).asPartial().asReadonly(),
);

/**
 * operation ID: Employee_put
 * `PUT: /employee/{id}`
 */
export const Employee_put = buildCall() //
  .args<rt.Static<typeof employee_putArgsRt>>()
  .method('put')
  .path((args) => `/employee/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: EmployeeCategory_search

const employeeCategory_searchArgsRt = rt
  .Record({
    id: rt.String,
    name: rt.String,
    number: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeCategory_search
 * `GET: /employee/category`
 */
export const EmployeeCategory_search = buildCall() //
  .args<rt.Static<typeof employeeCategory_searchArgsRt>>()
  .method('get')
  .path('/employee/category')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'name',
          'number',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: EmployeeCategory_post

const employeeCategory_postArgsRt = rt
  .Record({ body: employeeCategoryRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeCategory_post
 * `POST: /employee/category`
 */
export const EmployeeCategory_post = buildCall() //
  .args<rt.Static<typeof employeeCategory_postArgsRt>>()
  .method('post')
  .path('/employee/category')
  .body((args) => args.body)
  .build();

// Operation: EmployeeCategoryList_putList

const employeeCategoryList_putListArgsRt = rt
  .Record({ body: rt.Array(employeeCategoryRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeCategoryList_putList
 * `PUT: /employee/category/list`
 */
export const EmployeeCategoryList_putList = buildCall() //
  .args<rt.Static<typeof employeeCategoryList_putListArgsRt>>()
  .method('put')
  .path('/employee/category/list')
  .body((args) => args.body)
  .build();

// Operation: EmployeeCategoryList_postList

const employeeCategoryList_postListArgsRt = rt
  .Record({ body: rt.Array(employeeCategoryRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeCategoryList_postList
 * `POST: /employee/category/list`
 */
export const EmployeeCategoryList_postList = buildCall() //
  .args<rt.Static<typeof employeeCategoryList_postListArgsRt>>()
  .method('post')
  .path('/employee/category/list')
  .body((args) => args.body)
  .build();

// Operation: EmployeeCategoryList_deleteByIds

const employeeCategoryList_deleteByIdsArgsRt = rt
  .Record({ ids: rt.String })
  .asReadonly();

/**
 * operation ID: EmployeeCategoryList_deleteByIds
 * `DELETE: /employee/category/list`
 */
export const EmployeeCategoryList_deleteByIds = buildCall() //
  .args<rt.Static<typeof employeeCategoryList_deleteByIdsArgsRt>>()
  .method('delete')
  .path('/employee/category/list')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'ids')))
  .build();

// Operation: EmployeeCategory_get

const employeeCategory_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: EmployeeCategory_get
 * `GET: /employee/category/{id}`
 */
export const EmployeeCategory_get = buildCall() //
  .args<rt.Static<typeof employeeCategory_getArgsRt>>()
  .method('get')
  .path((args) => `/employee/category/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: EmployeeCategory_put

const employeeCategory_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: employeeCategoryRt }).asPartial().asReadonly(),
);

/**
 * operation ID: EmployeeCategory_put
 * `PUT: /employee/category/{id}`
 */
export const EmployeeCategory_put = buildCall() //
  .args<rt.Static<typeof employeeCategory_putArgsRt>>()
  .method('put')
  .path((args) => `/employee/category/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: EmployeeCategory_delete

const employeeCategory_deleteArgsRt = rt.Record({ id: rt.Number }).asReadonly();

/**
 * operation ID: EmployeeCategory_delete
 * `DELETE: /employee/category/{id}`
 */
export const EmployeeCategory_delete = buildCall() //
  .args<rt.Static<typeof employeeCategory_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/employee/category/${args.id}`)
  .build();

// Operation: EmployeeEmployment_search

const employeeEmployment_searchArgsRt = rt
  .Record({
    employeeId: rt.Number,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeEmployment_search
 * `GET: /employee/employment`
 */
export const EmployeeEmployment_search = buildCall() //
  .args<rt.Static<typeof employeeEmployment_searchArgsRt>>()
  .method('get')
  .path('/employee/employment')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'employeeId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: EmployeeEmployment_post

const employeeEmployment_postArgsRt = rt
  .Record({ body: employmentRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeEmployment_post
 * `POST: /employee/employment`
 */
export const EmployeeEmployment_post = buildCall() //
  .args<rt.Static<typeof employeeEmployment_postArgsRt>>()
  .method('post')
  .path('/employee/employment')
  .body((args) => args.body)
  .build();

// Operation: EmployeeEmployment_get

const employeeEmployment_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: EmployeeEmployment_get
 * `GET: /employee/employment/{id}`
 */
export const EmployeeEmployment_get = buildCall() //
  .args<rt.Static<typeof employeeEmployment_getArgsRt>>()
  .method('get')
  .path((args) => `/employee/employment/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: EmployeeEmployment_put

const employeeEmployment_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: employmentRt }).asPartial().asReadonly(),
);

/**
 * operation ID: EmployeeEmployment_put
 * `PUT: /employee/employment/{id}`
 */
export const EmployeeEmployment_put = buildCall() //
  .args<rt.Static<typeof employeeEmployment_putArgsRt>>()
  .method('put')
  .path((args) => `/employee/employment/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: EmployeeEmploymentDetails_search

const employeeEmploymentDetails_searchArgsRt = rt
  .Record({
    employmentId: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeEmploymentDetails_search
 * `GET: /employee/employment/details`
 */
export const EmployeeEmploymentDetails_search = buildCall() //
  .args<rt.Static<typeof employeeEmploymentDetails_searchArgsRt>>()
  .method('get')
  .path('/employee/employment/details')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'employmentId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: EmployeeEmploymentDetails_post

const employeeEmploymentDetails_postArgsRt = rt
  .Record({ body: employmentDetailsRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeEmploymentDetails_post
 * `POST: /employee/employment/details`
 */
export const EmployeeEmploymentDetails_post = buildCall() //
  .args<rt.Static<typeof employeeEmploymentDetails_postArgsRt>>()
  .method('post')
  .path('/employee/employment/details')
  .body((args) => args.body)
  .build();

// Operation: EmployeeEmploymentDetails_get

const employeeEmploymentDetails_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: EmployeeEmploymentDetails_get
 * `GET: /employee/employment/details/{id}`
 */
export const EmployeeEmploymentDetails_get = buildCall() //
  .args<rt.Static<typeof employeeEmploymentDetails_getArgsRt>>()
  .method('get')
  .path((args) => `/employee/employment/details/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: EmployeeEmploymentDetails_put

const employeeEmploymentDetails_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: employmentDetailsRt }).asPartial().asReadonly(),
);

/**
 * operation ID: EmployeeEmploymentDetails_put
 * `PUT: /employee/employment/details/{id}`
 */
export const EmployeeEmploymentDetails_put = buildCall() //
  .args<rt.Static<typeof employeeEmploymentDetails_putArgsRt>>()
  .method('put')
  .path((args) => `/employee/employment/details/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: EmployeeEmploymentEmploymentTypeMaritimeEmploymentType_getMaritimeEmploymentType

const employeeEmploymentEmploymentTypeMaritimeEmploymentType_getMaritimeEmploymentTypeArgsRt =
  rt.Intersect(
    rt
      .Record({
        type: rt.Union(
          rt.Literal('SHIP_REGISTER'),
          rt.Literal('SHIP_TYPE'),
          rt.Literal('TRADE_AREA'),
        ),
      })
      .asReadonly(),
    rt
      .Record({
        from: rt.Number,
        count: rt.Number,
        sorting: rt.String,
        fields: rt.String,
      })
      .asPartial()
      .asReadonly(),
  );

/**
 * operation ID:
 * EmployeeEmploymentEmploymentTypeMaritimeEmploymentType_getMaritimeEmploymentType
 * `GET:
 * /employee/employment/employmentType/maritimeEmploymentType`
 */
export const EmployeeEmploymentEmploymentTypeMaritimeEmploymentType_getMaritimeEmploymentType =
  buildCall() //
    .args<
      rt.Static<
        typeof employeeEmploymentEmploymentTypeMaritimeEmploymentType_getMaritimeEmploymentTypeArgsRt
      >
    >()
    .method('get')
    .path('/employee/employment/employmentType/maritimeEmploymentType')
    .query(
      (args) =>
        new URLSearchParams(
          pickQueryValues(args, 'type', 'from', 'count', 'sorting', 'fields'),
        ),
    )
    .build();

// Operation: EmployeeEmploymentEmploymentTypeSalaryType_getSalaryType

const employeeEmploymentEmploymentTypeSalaryType_getSalaryTypeArgsRt = rt
  .Record({
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID:
 * EmployeeEmploymentEmploymentTypeSalaryType_getSalaryType
 * `GET: /employee/employment/employmentType/salaryType`
 */
export const EmployeeEmploymentEmploymentTypeSalaryType_getSalaryType =
  buildCall() //
    .args<
      rt.Static<
        typeof employeeEmploymentEmploymentTypeSalaryType_getSalaryTypeArgsRt
      >
    >()
    .method('get')
    .path('/employee/employment/employmentType/salaryType')
    .query(
      (args) =>
        new URLSearchParams(
          pickQueryValues(args, 'from', 'count', 'sorting', 'fields'),
        ),
    )
    .build();

// Operation: EmployeeEmploymentEmploymentTypeScheduleType_getScheduleType

const employeeEmploymentEmploymentTypeScheduleType_getScheduleTypeArgsRt = rt
  .Record({
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID:
 * EmployeeEmploymentEmploymentTypeScheduleType_getScheduleType
 * `GET: /employee/employment/employmentType/scheduleType`
 */
export const EmployeeEmploymentEmploymentTypeScheduleType_getScheduleType =
  buildCall() //
    .args<
      rt.Static<
        typeof employeeEmploymentEmploymentTypeScheduleType_getScheduleTypeArgsRt
      >
    >()
    .method('get')
    .path('/employee/employment/employmentType/scheduleType')
    .query(
      (args) =>
        new URLSearchParams(
          pickQueryValues(args, 'from', 'count', 'sorting', 'fields'),
        ),
    )
    .build();

// Operation: EmployeeEmploymentEmploymentTypeEmploymentFormType_getEmploymentFormType

const employeeEmploymentEmploymentTypeEmploymentFormType_getEmploymentFormTypeArgsRt =
  rt
    .Record({
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly();

/**
 * operation ID:
 * EmployeeEmploymentEmploymentTypeEmploymentFormType_getEmploymentFormType
 * `GET:
 * /employee/employment/employmentType/employmentFormType`
 */
export const EmployeeEmploymentEmploymentTypeEmploymentFormType_getEmploymentFormType =
  buildCall() //
    .args<
      rt.Static<
        typeof employeeEmploymentEmploymentTypeEmploymentFormType_getEmploymentFormTypeArgsRt
      >
    >()
    .method('get')
    .path('/employee/employment/employmentType/employmentFormType')
    .query(
      (args) =>
        new URLSearchParams(
          pickQueryValues(args, 'from', 'count', 'sorting', 'fields'),
        ),
    )
    .build();

// Operation: EmployeeEmploymentEmploymentTypeEmploymentEndReasonType_getEmploymentEndReasonType

const employeeEmploymentEmploymentTypeEmploymentEndReasonType_getEmploymentEndReasonTypeArgsRt =
  rt
    .Record({
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly();

/**
 * operation ID:
 * EmployeeEmploymentEmploymentTypeEmploymentEndReasonType_getEmploymentEndReasonType
 * `GET:
 * /employee/employment/employmentType/employmentEndReasonType`
 */
export const EmployeeEmploymentEmploymentTypeEmploymentEndReasonType_getEmploymentEndReasonType =
  buildCall() //
    .args<
      rt.Static<
        typeof employeeEmploymentEmploymentTypeEmploymentEndReasonType_getEmploymentEndReasonTypeArgsRt
      >
    >()
    .method('get')
    .path('/employee/employment/employmentType/employmentEndReasonType')
    .query(
      (args) =>
        new URLSearchParams(
          pickQueryValues(args, 'from', 'count', 'sorting', 'fields'),
        ),
    )
    .build();

// Operation: EmployeeEmploymentEmploymentType_search

const employeeEmploymentEmploymentType_searchArgsRt = rt
  .Record({
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeEmploymentEmploymentType_search
 * `GET: /employee/employment/employmentType`
 */
export const EmployeeEmploymentEmploymentType_search = buildCall() //
  .args<rt.Static<typeof employeeEmploymentEmploymentType_searchArgsRt>>()
  .method('get')
  .path('/employee/employment/employmentType')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'from', 'count', 'sorting', 'fields'),
      ),
  )
  .build();

// Operation: EmployeeEmploymentLeaveOfAbsence_post

const employeeEmploymentLeaveOfAbsence_postArgsRt = rt
  .Record({ body: leaveOfAbsenceRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeEmploymentLeaveOfAbsence_post
 * `POST: /employee/employment/leaveOfAbsence`
 */
export const EmployeeEmploymentLeaveOfAbsence_post = buildCall() //
  .args<rt.Static<typeof employeeEmploymentLeaveOfAbsence_postArgsRt>>()
  .method('post')
  .path('/employee/employment/leaveOfAbsence')
  .body((args) => args.body)
  .build();

// Operation: EmployeeEmploymentLeaveOfAbsenceList_postList

const employeeEmploymentLeaveOfAbsenceList_postListArgsRt = rt
  .Record({ body: rt.Array(leaveOfAbsenceRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeEmploymentLeaveOfAbsenceList_postList
 * `POST: /employee/employment/leaveOfAbsence/list`
 */
export const EmployeeEmploymentLeaveOfAbsenceList_postList = buildCall() //
  .args<rt.Static<typeof employeeEmploymentLeaveOfAbsenceList_postListArgsRt>>()
  .method('post')
  .path('/employee/employment/leaveOfAbsence/list')
  .body((args) => args.body)
  .build();

// Operation: EmployeeEmploymentLeaveOfAbsence_get

const employeeEmploymentLeaveOfAbsence_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: EmployeeEmploymentLeaveOfAbsence_get
 * `GET: /employee/employment/leaveOfAbsence/{id}`
 */
export const EmployeeEmploymentLeaveOfAbsence_get = buildCall() //
  .args<rt.Static<typeof employeeEmploymentLeaveOfAbsence_getArgsRt>>()
  .method('get')
  .path((args) => `/employee/employment/leaveOfAbsence/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: EmployeeEmploymentLeaveOfAbsence_put

const employeeEmploymentLeaveOfAbsence_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: leaveOfAbsenceRt }).asPartial().asReadonly(),
);

/**
 * operation ID: EmployeeEmploymentLeaveOfAbsence_put
 * `PUT: /employee/employment/leaveOfAbsence/{id}`
 */
export const EmployeeEmploymentLeaveOfAbsence_put = buildCall() //
  .args<rt.Static<typeof employeeEmploymentLeaveOfAbsence_putArgsRt>>()
  .method('put')
  .path((args) => `/employee/employment/leaveOfAbsence/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: EmployeeEmploymentLeaveOfAbsenceType_search

const employeeEmploymentLeaveOfAbsenceType_searchArgsRt = rt
  .Record({
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeEmploymentLeaveOfAbsenceType_search
 * `GET: /employee/employment/leaveOfAbsenceType`
 */
export const EmployeeEmploymentLeaveOfAbsenceType_search = buildCall() //
  .args<rt.Static<typeof employeeEmploymentLeaveOfAbsenceType_searchArgsRt>>()
  .method('get')
  .path('/employee/employment/leaveOfAbsenceType')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'from', 'count', 'sorting', 'fields'),
      ),
  )
  .build();

// Operation: EmployeeEmploymentOccupationCode_search

const employeeEmploymentOccupationCode_searchArgsRt = rt
  .Record({
    nameNO: rt.String,
    code: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeEmploymentOccupationCode_search
 * `GET: /employee/employment/occupationCode`
 */
export const EmployeeEmploymentOccupationCode_search = buildCall() //
  .args<rt.Static<typeof employeeEmploymentOccupationCode_searchArgsRt>>()
  .method('get')
  .path('/employee/employment/occupationCode')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'nameNO',
          'code',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: EmployeeEmploymentRemunerationType_search

const employeeEmploymentRemunerationType_searchArgsRt = rt
  .Record({
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeEmploymentRemunerationType_search
 * `GET: /employee/employment/remunerationType`
 */
export const EmployeeEmploymentRemunerationType_search = buildCall() //
  .args<rt.Static<typeof employeeEmploymentRemunerationType_searchArgsRt>>()
  .method('get')
  .path('/employee/employment/remunerationType')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'from', 'count', 'sorting', 'fields'),
      ),
  )
  .build();

// Operation: EmployeeEmploymentWorkingHoursScheme_search

const employeeEmploymentWorkingHoursScheme_searchArgsRt = rt
  .Record({
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeEmploymentWorkingHoursScheme_search
 * `GET: /employee/employment/workingHoursScheme`
 */
export const EmployeeEmploymentWorkingHoursScheme_search = buildCall() //
  .args<rt.Static<typeof employeeEmploymentWorkingHoursScheme_searchArgsRt>>()
  .method('get')
  .path('/employee/employment/workingHoursScheme')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'from', 'count', 'sorting', 'fields'),
      ),
  )
  .build();

// Operation: EmployeeHourlyCostAndRate_search

const employeeHourlyCostAndRate_searchArgsRt = rt
  .Record({
    employeeId: rt.Number,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeHourlyCostAndRate_search
 * `GET: /employee/hourlyCostAndRate`
 */
export const EmployeeHourlyCostAndRate_search = buildCall() //
  .args<rt.Static<typeof employeeHourlyCostAndRate_searchArgsRt>>()
  .method('get')
  .path('/employee/hourlyCostAndRate')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'employeeId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: EmployeeHourlyCostAndRate_post

const employeeHourlyCostAndRate_postArgsRt = rt
  .Record({ body: hourlyCostAndRateRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeHourlyCostAndRate_post
 * `POST: /employee/hourlyCostAndRate`
 */
export const EmployeeHourlyCostAndRate_post = buildCall() //
  .args<rt.Static<typeof employeeHourlyCostAndRate_postArgsRt>>()
  .method('post')
  .path('/employee/hourlyCostAndRate')
  .body((args) => args.body)
  .build();

// Operation: EmployeeHourlyCostAndRate_get

const employeeHourlyCostAndRate_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: EmployeeHourlyCostAndRate_get
 * `GET: /employee/hourlyCostAndRate/{id}`
 */
export const EmployeeHourlyCostAndRate_get = buildCall() //
  .args<rt.Static<typeof employeeHourlyCostAndRate_getArgsRt>>()
  .method('get')
  .path((args) => `/employee/hourlyCostAndRate/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: EmployeeHourlyCostAndRate_put

const employeeHourlyCostAndRate_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: hourlyCostAndRateRt }).asPartial().asReadonly(),
);

/**
 * operation ID: EmployeeHourlyCostAndRate_put
 * `PUT: /employee/hourlyCostAndRate/{id}`
 */
export const EmployeeHourlyCostAndRate_put = buildCall() //
  .args<rt.Static<typeof employeeHourlyCostAndRate_putArgsRt>>()
  .method('put')
  .path((args) => `/employee/hourlyCostAndRate/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: EmployeeNextOfKin_search

const employeeNextOfKin_searchArgsRt = rt
  .Record({
    employeeId: rt.Number,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeNextOfKin_search
 * `GET: /employee/nextOfKin`
 */
export const EmployeeNextOfKin_search = buildCall() //
  .args<rt.Static<typeof employeeNextOfKin_searchArgsRt>>()
  .method('get')
  .path('/employee/nextOfKin')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'employeeId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: EmployeeNextOfKin_post

const employeeNextOfKin_postArgsRt = rt
  .Record({ body: nextOfKinRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeNextOfKin_post
 * `POST: /employee/nextOfKin`
 */
export const EmployeeNextOfKin_post = buildCall() //
  .args<rt.Static<typeof employeeNextOfKin_postArgsRt>>()
  .method('post')
  .path('/employee/nextOfKin')
  .body((args) => args.body)
  .build();

// Operation: EmployeeNextOfKin_get

const employeeNextOfKin_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: EmployeeNextOfKin_get
 * `GET: /employee/nextOfKin/{id}`
 */
export const EmployeeNextOfKin_get = buildCall() //
  .args<rt.Static<typeof employeeNextOfKin_getArgsRt>>()
  .method('get')
  .path((args) => `/employee/nextOfKin/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: EmployeeNextOfKin_put

const employeeNextOfKin_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: nextOfKinRt }).asPartial().asReadonly(),
);

/**
 * operation ID: EmployeeNextOfKin_put
 * `PUT: /employee/nextOfKin/{id}`
 */
export const EmployeeNextOfKin_put = buildCall() //
  .args<rt.Static<typeof employeeNextOfKin_putArgsRt>>()
  .method('put')
  .path((args) => `/employee/nextOfKin/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: EmployeeStandardTime_search

const employeeStandardTime_searchArgsRt = rt
  .Record({
    employeeId: rt.Number,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeStandardTime_search
 * `GET: /employee/standardTime`
 */
export const EmployeeStandardTime_search = buildCall() //
  .args<rt.Static<typeof employeeStandardTime_searchArgsRt>>()
  .method('get')
  .path('/employee/standardTime')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'employeeId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: EmployeeStandardTime_post

const employeeStandardTime_postArgsRt = rt
  .Record({ body: standardTimeRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeStandardTime_post
 * `POST: /employee/standardTime`
 */
export const EmployeeStandardTime_post = buildCall() //
  .args<rt.Static<typeof employeeStandardTime_postArgsRt>>()
  .method('post')
  .path('/employee/standardTime')
  .body((args) => args.body)
  .build();

// Operation: EmployeeStandardTime_get

const employeeStandardTime_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: EmployeeStandardTime_get
 * `GET: /employee/standardTime/{id}`
 */
export const EmployeeStandardTime_get = buildCall() //
  .args<rt.Static<typeof employeeStandardTime_getArgsRt>>()
  .method('get')
  .path((args) => `/employee/standardTime/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: EmployeeStandardTime_put

const employeeStandardTime_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: standardTimeRt }).asPartial().asReadonly(),
);

/**
 * operation ID: EmployeeStandardTime_put
 * `PUT: /employee/standardTime/{id}`
 */
export const EmployeeStandardTime_put = buildCall() //
  .args<rt.Static<typeof employeeStandardTime_putArgsRt>>()
  .method('put')
  .path((args) => `/employee/standardTime/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: EmployeeEntitlement_search

const employeeEntitlement_searchArgsRt = rt
  .Record({
    employeeId: rt.Number,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeEntitlement_search
 * `GET: /employee/entitlement`
 */
export const EmployeeEntitlement_search = buildCall() //
  .args<rt.Static<typeof employeeEntitlement_searchArgsRt>>()
  .method('get')
  .path('/employee/entitlement')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'employeeId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: EmployeeEntitlementGrantClientEntitlementsByTemplate_grantClientEntitlementsByTemplate

const employeeEntitlementGrantClientEntitlementsByTemplate_grantClientEntitlementsByTemplateArgsRt =
  rt.Intersect(
    rt
      .Record({
        employeeId: rt.Number,
        customerId: rt.Number,
        template: rt.Union(
          rt.Literal('NONE_PRIVILEGES'),
          rt.Literal('STANDARD_PRIVILEGES_ACCOUNTANT'),
          rt.Literal('STANDARD_PRIVILEGES_AUDITOR'),
          rt.Literal('ALL_PRIVILEGES'),
          rt.Literal('AGRO_READ_ONLY'),
          rt.Literal('AGRO_READ_APPROVE'),
          rt.Literal('AGRO_READ_WRITE'),
          rt.Literal('AGRO_READ_WRITE_APPROVE'),
          rt.Literal('MAMUT_PAYROLL_ADMIN'),
          rt.Literal('MAMUT_PAYROLL_CLERK'),
          rt.Literal('AGRO_PAYROLL_ADMIN'),
          rt.Literal('AGRO_PAYROLL_CLERK'),
          rt.Literal('AGRO_INVOICE_ADMIN'),
          rt.Literal('AGRO_INVOICE_CLERK'),
        ),
      })
      .asReadonly(),
    rt.Record({ addToExisting: rt.Boolean }).asPartial().asReadonly(),
  );

/**
 * operation ID:
 * EmployeeEntitlementGrantClientEntitlementsByTemplate_grantClientEntitlementsByTemplate
 * `PUT:
 * /employee/entitlement/:grantClientEntitlementsByTemplate`
 */
export const EmployeeEntitlementGrantClientEntitlementsByTemplate_grantClientEntitlementsByTemplate =
  buildCall() //
    .args<
      rt.Static<
        typeof employeeEntitlementGrantClientEntitlementsByTemplate_grantClientEntitlementsByTemplateArgsRt
      >
    >()
    .method('put')
    .path('/employee/entitlement/:grantClientEntitlementsByTemplate')
    .query(
      (args) =>
        new URLSearchParams(
          pickQueryValues(
            args,
            'employeeId',
            'customerId',
            'template',
            'addToExisting',
          ),
        ),
    )
    .build();

// Operation: EmployeeEntitlementGrantEntitlementsByTemplate_grantEntitlementsByTemplate

const employeeEntitlementGrantEntitlementsByTemplate_grantEntitlementsByTemplateArgsRt =
  rt
    .Record({
      employeeId: rt.Number,
      template: rt.Union(
        rt.Literal('NONE_PRIVILEGES'),
        rt.Literal('ALL_PRIVILEGES'),
        rt.Literal('INVOICING_MANAGER'),
        rt.Literal('PERSONELL_MANAGER'),
        rt.Literal('ACCOUNTANT'),
        rt.Literal('AUDITOR'),
        rt.Literal('DEPARTMENT_LEADER'),
        rt.Literal('MAMUT_USER_ADMIN'),
        rt.Literal('MAMUT_USER'),
      ),
    })
    .asReadonly();

/**
 * operation ID:
 * EmployeeEntitlementGrantEntitlementsByTemplate_grantEntitlementsByTemplate
 * `PUT: /employee/entitlement/:grantEntitlementsByTemplate`
 * The user will only receive the entitlements which are
 * possible with the registered user type
 */
export const EmployeeEntitlementGrantEntitlementsByTemplate_grantEntitlementsByTemplate =
  buildCall() //
    .args<
      rt.Static<
        typeof employeeEntitlementGrantEntitlementsByTemplate_grantEntitlementsByTemplateArgsRt
      >
    >()
    .method('put')
    .path('/employee/entitlement/:grantEntitlementsByTemplate')
    .query(
      (args) =>
        new URLSearchParams(pickQueryValues(args, 'employeeId', 'template')),
    )
    .build();

// Operation: EmployeeEntitlementClient_client

const employeeEntitlementClient_clientArgsRt = rt
  .Record({
    employeeId: rt.Number,
    customerId: rt.Number,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EmployeeEntitlementClient_client
 * `GET: /employee/entitlement/client`
 */
export const EmployeeEntitlementClient_client = buildCall() //
  .args<rt.Static<typeof employeeEntitlementClient_clientArgsRt>>()
  .method('get')
  .path('/employee/entitlement/client')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'employeeId',
          'customerId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: EmployeeEntitlement_get

const employeeEntitlement_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: EmployeeEntitlement_get
 * `GET: /employee/entitlement/{id}`
 */
export const EmployeeEntitlement_get = buildCall() //
  .args<rt.Static<typeof employeeEntitlement_getArgsRt>>()
  .method('get')
  .path((args) => `/employee/entitlement/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: Event_example

const event_exampleArgsRt = rt.Intersect(
  rt.Record({ eventType: rt.String }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: Event_example
 * `GET: /event/{eventType}`
 */
export const Event_example = buildCall() //
  .args<rt.Static<typeof event_exampleArgsRt>>()
  .method('get')
  .path((args) => `/event/${args.eventType}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: Event_get

const event_getArgsRt = rt
  .Record({ fields: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Event_get
 * `GET: /event`
 */
export const Event_get = buildCall() //
  .args<rt.Static<typeof event_getArgsRt>>()
  .method('get')
  .path('/event')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: EventSubscription_search

const eventSubscription_searchArgsRt = rt
  .Record({
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EventSubscription_search
 * `GET: /event/subscription`
 */
export const EventSubscription_search = buildCall() //
  .args<rt.Static<typeof eventSubscription_searchArgsRt>>()
  .method('get')
  .path('/event/subscription')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'from', 'count', 'sorting', 'fields'),
      ),
  )
  .build();

// Operation: EventSubscription_post

const eventSubscription_postArgsRt = rt
  .Record({ body: subscriptionRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EventSubscription_post
 * `POST: /event/subscription`
 */
export const EventSubscription_post = buildCall() //
  .args<rt.Static<typeof eventSubscription_postArgsRt>>()
  .method('post')
  .path('/event/subscription')
  .body((args) => args.body)
  .build();

// Operation: EventSubscriptionList_putList

const eventSubscriptionList_putListArgsRt = rt
  .Record({ body: rt.Array(subscriptionRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EventSubscriptionList_putList
 * `PUT: /event/subscription/list`
 */
export const EventSubscriptionList_putList = buildCall() //
  .args<rt.Static<typeof eventSubscriptionList_putListArgsRt>>()
  .method('put')
  .path('/event/subscription/list')
  .body((args) => args.body)
  .build();

// Operation: EventSubscriptionList_postList

const eventSubscriptionList_postListArgsRt = rt
  .Record({ body: rt.Array(subscriptionRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: EventSubscriptionList_postList
 * `POST: /event/subscription/list`
 */
export const EventSubscriptionList_postList = buildCall() //
  .args<rt.Static<typeof eventSubscriptionList_postListArgsRt>>()
  .method('post')
  .path('/event/subscription/list')
  .body((args) => args.body)
  .build();

// Operation: EventSubscriptionList_deleteByIds

const eventSubscriptionList_deleteByIdsArgsRt = rt
  .Record({ ids: rt.String })
  .asReadonly();

/**
 * operation ID: EventSubscriptionList_deleteByIds
 * `DELETE: /event/subscription/list`
 */
export const EventSubscriptionList_deleteByIds = buildCall() //
  .args<rt.Static<typeof eventSubscriptionList_deleteByIdsArgsRt>>()
  .method('delete')
  .path('/event/subscription/list')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'ids')))
  .build();

// Operation: EventSubscription_get

const eventSubscription_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: EventSubscription_get
 * `GET: /event/subscription/{id}`
 */
export const EventSubscription_get = buildCall() //
  .args<rt.Static<typeof eventSubscription_getArgsRt>>()
  .method('get')
  .path((args) => `/event/subscription/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: EventSubscription_put

const eventSubscription_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: subscriptionRt }).asPartial().asReadonly(),
);

/**
 * operation ID: EventSubscription_put
 * `PUT: /event/subscription/{id}`
 */
export const EventSubscription_put = buildCall() //
  .args<rt.Static<typeof eventSubscription_putArgsRt>>()
  .method('put')
  .path((args) => `/event/subscription/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: EventSubscription_delete

const eventSubscription_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: EventSubscription_delete
 * `DELETE: /event/subscription/{id}`
 */
export const EventSubscription_delete = buildCall() //
  .args<rt.Static<typeof eventSubscription_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/event/subscription/${args.id}`)
  .build();

// Operation: Inventory_search

const inventory_searchArgsRt = rt
  .Record({
    id: rt.String,
    name: rt.String,
    isMainInventory: rt.Boolean,
    isInactive: rt.Boolean,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Inventory_search
 * `GET: /inventory`
 */
export const Inventory_search = buildCall() //
  .args<rt.Static<typeof inventory_searchArgsRt>>()
  .method('get')
  .path('/inventory')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'name',
          'isMainInventory',
          'isInactive',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: Inventory_post

const inventory_postArgsRt = rt
  .Record({ body: inventoryRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Inventory_post
 * `POST: /inventory`
 */
export const Inventory_post = buildCall() //
  .args<rt.Static<typeof inventory_postArgsRt>>()
  .method('post')
  .path('/inventory')
  .body((args) => args.body)
  .build();

// Operation: Inventory_get

const inventory_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: Inventory_get
 * `GET: /inventory/{id}`
 */
export const Inventory_get = buildCall() //
  .args<rt.Static<typeof inventory_getArgsRt>>()
  .method('get')
  .path((args) => `/inventory/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: Inventory_put

const inventory_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: inventoryRt }).asPartial().asReadonly(),
);

/**
 * operation ID: Inventory_put
 * `PUT: /inventory/{id}`
 */
export const Inventory_put = buildCall() //
  .args<rt.Static<typeof inventory_putArgsRt>>()
  .method('put')
  .path((args) => `/inventory/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: Inventory_delete

const inventory_deleteArgsRt = rt.Record({ id: rt.Number }).asReadonly();

/**
 * operation ID: Inventory_delete
 * `DELETE: /inventory/{id}`
 */
export const Inventory_delete = buildCall() //
  .args<rt.Static<typeof inventory_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/inventory/${args.id}`)
  .build();

// Operation: InventoryInventories_search

const inventoryInventories_searchArgsRt = rt.Intersect(
  rt.Record({ dateFrom: rt.String, dateTo: rt.String }).asReadonly(),
  rt
    .Record({
      productId: rt.Number,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: InventoryInventories_search
 * `GET: /inventory/inventories`
 */
export const InventoryInventories_search = buildCall() //
  .args<rt.Static<typeof inventoryInventories_searchArgsRt>>()
  .method('get')
  .path('/inventory/inventories')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'dateFrom',
          'dateTo',
          'productId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: InventoryLocation_search

const inventoryLocation_searchArgsRt = rt
  .Record({
    warehouseId: rt.String,
    isInactive: rt.Boolean,
    name: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: InventoryLocation_search
 * `GET: /inventory/location`
 */
export const InventoryLocation_search = buildCall() //
  .args<rt.Static<typeof inventoryLocation_searchArgsRt>>()
  .method('get')
  .path('/inventory/location')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'warehouseId',
          'isInactive',
          'name',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: InventoryLocation_post

const inventoryLocation_postArgsRt = rt
  .Record({ body: inventoryLocationRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: InventoryLocation_post
 * `POST: /inventory/location`
 */
export const InventoryLocation_post = buildCall() //
  .args<rt.Static<typeof inventoryLocation_postArgsRt>>()
  .method('post')
  .path('/inventory/location')
  .body((args) => args.body)
  .build();

// Operation: InventoryLocationList_putList

const inventoryLocationList_putListArgsRt = rt
  .Record({ body: rt.Array(inventoryLocationRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: InventoryLocationList_putList
 * `PUT: /inventory/location/list`
 */
export const InventoryLocationList_putList = buildCall() //
  .args<rt.Static<typeof inventoryLocationList_putListArgsRt>>()
  .method('put')
  .path('/inventory/location/list')
  .body((args) => args.body)
  .build();

// Operation: InventoryLocationList_postList

const inventoryLocationList_postListArgsRt = rt
  .Record({ body: rt.Array(inventoryLocationRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: InventoryLocationList_postList
 * `POST: /inventory/location/list`
 */
export const InventoryLocationList_postList = buildCall() //
  .args<rt.Static<typeof inventoryLocationList_postListArgsRt>>()
  .method('post')
  .path('/inventory/location/list')
  .body((args) => args.body)
  .build();

// Operation: InventoryLocation_get

const inventoryLocation_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: InventoryLocation_get
 * `GET: /inventory/location/{id}`
 */
export const InventoryLocation_get = buildCall() //
  .args<rt.Static<typeof inventoryLocation_getArgsRt>>()
  .method('get')
  .path((args) => `/inventory/location/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: InventoryLocation_put

const inventoryLocation_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: inventoryLocationRt }).asPartial().asReadonly(),
);

/**
 * operation ID: InventoryLocation_put
 * `PUT: /inventory/location/{id}`
 */
export const InventoryLocation_put = buildCall() //
  .args<rt.Static<typeof inventoryLocation_putArgsRt>>()
  .method('put')
  .path((args) => `/inventory/location/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: InventoryLocation_delete

const inventoryLocation_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: InventoryLocation_delete
 * `DELETE: /inventory/location/{id}`
 */
export const InventoryLocation_delete = buildCall() //
  .args<rt.Static<typeof inventoryLocation_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/inventory/location/${args.id}`)
  .build();

// Operation: InventoryStocktaking_search

const inventoryStocktaking_searchArgsRt = rt
  .Record({
    id: rt.String,
    isCompleted: rt.Boolean,
    inventoryId: rt.Number,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: InventoryStocktaking_search
 * `GET: /inventory/stocktaking`
 */
export const InventoryStocktaking_search = buildCall() //
  .args<rt.Static<typeof inventoryStocktaking_searchArgsRt>>()
  .method('get')
  .path('/inventory/stocktaking')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'isCompleted',
          'inventoryId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: InventoryStocktaking_post

const inventoryStocktaking_postArgsRt = rt
  .Record({
    typeOfStocktaking: rt.Union(
      rt.Literal('ALL_PRODUCTS_WITH_INVENTORIES'),
      rt.Literal('INCLUDE_PRODUCTS'),
      rt.Literal('NO_PRODUCTS'),
    ),
    body: stocktakingRt,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: InventoryStocktaking_post
 * `POST: /inventory/stocktaking`
 */
export const InventoryStocktaking_post = buildCall() //
  .args<rt.Static<typeof inventoryStocktaking_postArgsRt>>()
  .method('post')
  .path('/inventory/stocktaking')
  .query(
    (args) => new URLSearchParams(pickQueryValues(args, 'typeOfStocktaking')),
  )
  .body((args) => args.body)
  .build();

// Operation: InventoryStocktaking_get

const inventoryStocktaking_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: InventoryStocktaking_get
 * `GET: /inventory/stocktaking/{id}`
 */
export const InventoryStocktaking_get = buildCall() //
  .args<rt.Static<typeof inventoryStocktaking_getArgsRt>>()
  .method('get')
  .path((args) => `/inventory/stocktaking/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: InventoryStocktaking_put

const inventoryStocktaking_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: stocktakingRt }).asPartial().asReadonly(),
);

/**
 * operation ID: InventoryStocktaking_put
 * `PUT: /inventory/stocktaking/{id}`
 */
export const InventoryStocktaking_put = buildCall() //
  .args<rt.Static<typeof inventoryStocktaking_putArgsRt>>()
  .method('put')
  .path((args) => `/inventory/stocktaking/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: InventoryStocktaking_delete

const inventoryStocktaking_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: InventoryStocktaking_delete
 * `DELETE: /inventory/stocktaking/{id}`
 */
export const InventoryStocktaking_delete = buildCall() //
  .args<rt.Static<typeof inventoryStocktaking_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/inventory/stocktaking/${args.id}`)
  .build();

// Operation: InventoryStocktakingProductline_search

const inventoryStocktakingProductline_searchArgsRt = rt.Intersect(
  rt.Record({ stocktakingId: rt.Number }).asReadonly(),
  rt
    .Record({
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: InventoryStocktakingProductline_search
 * `GET: /inventory/stocktaking/productline`
 */
export const InventoryStocktakingProductline_search = buildCall() //
  .args<rt.Static<typeof inventoryStocktakingProductline_searchArgsRt>>()
  .method('get')
  .path('/inventory/stocktaking/productline')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'stocktakingId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: InventoryStocktakingProductline_post

const inventoryStocktakingProductline_postArgsRt = rt
  .Record({ body: productLineRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: InventoryStocktakingProductline_post
 * `POST: /inventory/stocktaking/productline`
 */
export const InventoryStocktakingProductline_post = buildCall() //
  .args<rt.Static<typeof inventoryStocktakingProductline_postArgsRt>>()
  .method('post')
  .path('/inventory/stocktaking/productline')
  .body((args) => args.body)
  .build();

// Operation: InventoryStocktakingProductline_get

const inventoryStocktakingProductline_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: InventoryStocktakingProductline_get
 * `GET: /inventory/stocktaking/productline/{id}`
 */
export const InventoryStocktakingProductline_get = buildCall() //
  .args<rt.Static<typeof inventoryStocktakingProductline_getArgsRt>>()
  .method('get')
  .path((args) => `/inventory/stocktaking/productline/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: InventoryStocktakingProductline_put

const inventoryStocktakingProductline_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: productLineRt }).asPartial().asReadonly(),
);

/**
 * operation ID: InventoryStocktakingProductline_put
 * `PUT: /inventory/stocktaking/productline/{id}`
 */
export const InventoryStocktakingProductline_put = buildCall() //
  .args<rt.Static<typeof inventoryStocktakingProductline_putArgsRt>>()
  .method('put')
  .path((args) => `/inventory/stocktaking/productline/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: InventoryStocktakingProductline_delete

const inventoryStocktakingProductline_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: InventoryStocktakingProductline_delete
 * `DELETE: /inventory/stocktaking/productline/{id}`
 */
export const InventoryStocktakingProductline_delete = buildCall() //
  .args<rt.Static<typeof inventoryStocktakingProductline_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/inventory/stocktaking/productline/${args.id}`)
  .build();

// Operation: Invoice_search

const invoice_searchArgsRt = rt.Intersect(
  rt
    .Record({ invoiceDateFrom: rt.String, invoiceDateTo: rt.String })
    .asReadonly(),
  rt
    .Record({
      id: rt.String,
      invoiceNumber: rt.String,
      kid: rt.String,
      voucherId: rt.String,
      customerId: rt.String,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: Invoice_search
 * `GET: /invoice`
 */
export const Invoice_search = buildCall() //
  .args<rt.Static<typeof invoice_searchArgsRt>>()
  .method('get')
  .path('/invoice')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'invoiceDateFrom',
          'invoiceDateTo',
          'invoiceNumber',
          'kid',
          'voucherId',
          'customerId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: Invoice_post

const invoice_postArgsRt = rt
  .Record({
    body: invoiceRt,
    sendToCustomer: rt.Boolean,
    paymentTypeId: rt.Number,
    paidAmount: rt.Number,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Invoice_post
 * `POST: /invoice`
 */
export const Invoice_post = buildCall() //
  .args<rt.Static<typeof invoice_postArgsRt>>()
  .method('post')
  .path('/invoice')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'sendToCustomer', 'paymentTypeId', 'paidAmount'),
      ),
  )
  .body((args) => args.body)
  .build();

// Operation: InvoiceList_postList

const invoiceList_postListArgsRt = rt
  .Record({ body: rt.Array(invoiceRt), sendToCustomer: rt.Boolean })
  .asPartial()
  .asReadonly();

/**
 * operation ID: InvoiceList_postList
 * `POST: /invoice/list`
 */
export const InvoiceList_postList = buildCall() //
  .args<rt.Static<typeof invoiceList_postListArgsRt>>()
  .method('post')
  .path('/invoice/list')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'sendToCustomer')))
  .body((args) => args.body)
  .build();

// Operation: InvoicePdf_downloadPdf

const invoicePdf_downloadPdfArgsRt = rt
  .Record({ invoiceId: rt.Number })
  .asReadonly();

/**
 * operation ID: InvoicePdf_downloadPdf
 * `GET: /invoice/{invoiceId}/pdf`
 */
export const InvoicePdf_downloadPdf = buildCall() //
  .args<rt.Static<typeof invoicePdf_downloadPdfArgsRt>>()
  .method('get')
  .path((args) => `/invoice/${args.invoiceId}/pdf`)
  .build();

// Operation: InvoiceSend_send

const invoiceSend_sendArgsRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      sendType: rt.Union(
        rt.Literal('EMAIL'),
        rt.Literal('EHF'),
        rt.Literal('EFAKTURA'),
        rt.Literal('VIPPS'),
        rt.Literal('PAPER'),
      ),
    })
    .asReadonly(),
  rt.Record({ overrideEmailAddress: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: InvoiceSend_send
 * `PUT: /invoice/{id}/:send`
 */
export const InvoiceSend_send = buildCall() //
  .args<rt.Static<typeof invoiceSend_sendArgsRt>>()
  .method('put')
  .path((args) => `/invoice/${args.id}/:send`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'sendType', 'overrideEmailAddress'),
      ),
  )
  .build();

// Operation: InvoicePayment_payment

const invoicePayment_paymentArgsRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      paymentDate: rt.String,
      paymentTypeId: rt.Number,
      paidAmount: rt.Number,
    })
    .asReadonly(),
  rt.Record({ paidAmountCurrency: rt.Number }).asPartial().asReadonly(),
);

/**
 * operation ID: InvoicePayment_payment
 * `PUT: /invoice/{id}/:payment`
 */
export const InvoicePayment_payment = buildCall() //
  .args<rt.Static<typeof invoicePayment_paymentArgsRt>>()
  .method('put')
  .path((args) => `/invoice/${args.id}/:payment`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'paymentDate',
          'paymentTypeId',
          'paidAmount',
          'paidAmountCurrency',
        ),
      ),
  )
  .build();

// Operation: InvoiceCreateCreditNote_createCreditNote

const invoiceCreateCreditNote_createCreditNoteArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number, date: rt.String }).asReadonly(),
  rt
    .Record({ comment: rt.String, creditNoteEmail: rt.String })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: InvoiceCreateCreditNote_createCreditNote
 * `PUT: /invoice/{id}/:createCreditNote`
 */
export const InvoiceCreateCreditNote_createCreditNote = buildCall() //
  .args<rt.Static<typeof invoiceCreateCreditNote_createCreditNoteArgsRt>>()
  .method('put')
  .path((args) => `/invoice/${args.id}/:createCreditNote`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'date', 'comment', 'creditNoteEmail'),
      ),
  )
  .build();

// Operation: InvoiceCreateReminder_createReminder

const invoiceCreateReminder_createReminderArgsRt = rt.Intersect(
  rt
    .Record({
      id: rt.Number,
      type: rt.Union(
        rt.Literal('SOFT_REMINDER'),
        rt.Literal('REMINDER'),
        rt.Literal('NOTICE_OF_DEBT_COLLECTION'),
        rt.Literal('DEBT_COLLECTION'),
      ),
      date: rt.String,
      dispatchType: rt.Union(
        rt.Literal('NETS_PRINT'),
        rt.Literal('EMAIL'),
        rt.Literal('SMS'),
      ),
    })
    .asReadonly(),
  rt
    .Record({
      includeCharge: rt.Boolean,
      includeInterest: rt.Boolean,
      smsNumber: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: InvoiceCreateReminder_createReminder
 * `PUT: /invoice/{id}/:createReminder`
 */
export const InvoiceCreateReminder_createReminder = buildCall() //
  .args<rt.Static<typeof invoiceCreateReminder_createReminderArgsRt>>()
  .method('put')
  .path((args) => `/invoice/${args.id}/:createReminder`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'type',
          'date',
          'includeCharge',
          'includeInterest',
          'dispatchType',
          'smsNumber',
        ),
      ),
  )
  .build();

// Operation: Invoice_get

const invoice_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: Invoice_get
 * `GET: /invoice/{id}`
 */
export const Invoice_get = buildCall() //
  .args<rt.Static<typeof invoice_getArgsRt>>()
  .method('get')
  .path((args) => `/invoice/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: InvoicePaymentType_get

const invoicePaymentType_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: InvoicePaymentType_get
 * `GET: /invoice/paymentType/{id}`
 */
export const InvoicePaymentType_get = buildCall() //
  .args<rt.Static<typeof invoicePaymentType_getArgsRt>>()
  .method('get')
  .path((args) => `/invoice/paymentType/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: InvoicePaymentType_search

const invoicePaymentType_searchArgsRt = rt
  .Record({
    id: rt.String,
    description: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: InvoicePaymentType_search
 * `GET: /invoice/paymentType`
 */
export const InvoicePaymentType_search = buildCall() //
  .args<rt.Static<typeof invoicePaymentType_searchArgsRt>>()
  .method('get')
  .path('/invoice/paymentType')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'description',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: InvoiceDetails_get

const invoiceDetails_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: InvoiceDetails_get
 * `GET: /invoice/details/{id}`
 */
export const InvoiceDetails_get = buildCall() //
  .args<rt.Static<typeof invoiceDetails_getArgsRt>>()
  .method('get')
  .path((args) => `/invoice/details/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: InvoiceDetails_search

const invoiceDetails_searchArgsRt = rt.Intersect(
  rt
    .Record({ invoiceDateFrom: rt.String, invoiceDateTo: rt.String })
    .asReadonly(),
  rt
    .Record({
      id: rt.String,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: InvoiceDetails_search
 * `GET: /invoice/details`
 */
export const InvoiceDetails_search = buildCall() //
  .args<rt.Static<typeof invoiceDetails_searchArgsRt>>()
  .method('get')
  .path('/invoice/details')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'invoiceDateFrom',
          'invoiceDateTo',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: LedgerOpenPost_openPost

const ledgerOpenPost_openPostArgsRt = rt.Intersect(
  rt.Record({ date: rt.String }).asReadonly(),
  rt
    .Record({
      accountId: rt.Number,
      supplierId: rt.Number,
      customerId: rt.Number,
      employeeId: rt.Number,
      departmentId: rt.Number,
      projectId: rt.Number,
      productId: rt.Number,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: LedgerOpenPost_openPost
 * `GET: /ledger/openPost`
 */
export const LedgerOpenPost_openPost = buildCall() //
  .args<rt.Static<typeof ledgerOpenPost_openPostArgsRt>>()
  .method('get')
  .path('/ledger/openPost')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'date',
          'accountId',
          'supplierId',
          'customerId',
          'employeeId',
          'departmentId',
          'projectId',
          'productId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: Ledger_search

const ledger_searchArgsRt = rt.Intersect(
  rt.Record({ dateFrom: rt.String, dateTo: rt.String }).asReadonly(),
  rt
    .Record({
      openPostings: rt.String,
      accountId: rt.Number,
      supplierId: rt.Number,
      customerId: rt.Number,
      employeeId: rt.Number,
      departmentId: rt.Number,
      projectId: rt.Number,
      productId: rt.Number,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: Ledger_search
 * `GET: /ledger`
 */
export const Ledger_search = buildCall() //
  .args<rt.Static<typeof ledger_searchArgsRt>>()
  .method('get')
  .path('/ledger')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'dateFrom',
          'dateTo',
          'openPostings',
          'accountId',
          'supplierId',
          'customerId',
          'employeeId',
          'departmentId',
          'projectId',
          'productId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: LedgerAccount_search

const ledgerAccount_searchArgsRt = rt
  .Record({
    id: rt.String,
    number: rt.String,
    isBankAccount: rt.Boolean,
    isInactive: rt.Boolean,
    isApplicableForSupplierInvoice: rt.Boolean,
    ledgerType: rt.Union(
      rt.Literal('GENERAL'),
      rt.Literal('CUSTOMER'),
      rt.Literal('VENDOR'),
      rt.Literal('EMPLOYEE'),
      rt.Literal('ASSET'),
    ),
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: LedgerAccount_search
 * `GET: /ledger/account`
 */
export const LedgerAccount_search = buildCall() //
  .args<rt.Static<typeof ledgerAccount_searchArgsRt>>()
  .method('get')
  .path('/ledger/account')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'number',
          'isBankAccount',
          'isInactive',
          'isApplicableForSupplierInvoice',
          'ledgerType',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: LedgerAccount_post

const ledgerAccount_postArgsRt = rt
  .Record({ body: accountRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: LedgerAccount_post
 * `POST: /ledger/account`
 */
export const LedgerAccount_post = buildCall() //
  .args<rt.Static<typeof ledgerAccount_postArgsRt>>()
  .method('post')
  .path('/ledger/account')
  .body((args) => args.body)
  .build();

// Operation: LedgerAccountList_putList

const ledgerAccountList_putListArgsRt = rt
  .Record({ body: rt.Array(accountRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: LedgerAccountList_putList
 * `PUT: /ledger/account/list`
 */
export const LedgerAccountList_putList = buildCall() //
  .args<rt.Static<typeof ledgerAccountList_putListArgsRt>>()
  .method('put')
  .path('/ledger/account/list')
  .body((args) => args.body)
  .build();

// Operation: LedgerAccountList_postList

const ledgerAccountList_postListArgsRt = rt
  .Record({ body: rt.Array(accountRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: LedgerAccountList_postList
 * `POST: /ledger/account/list`
 */
export const LedgerAccountList_postList = buildCall() //
  .args<rt.Static<typeof ledgerAccountList_postListArgsRt>>()
  .method('post')
  .path('/ledger/account/list')
  .body((args) => args.body)
  .build();

// Operation: LedgerAccountList_deleteByIds

const ledgerAccountList_deleteByIdsArgsRt = rt
  .Record({ ids: rt.String })
  .asReadonly();

/**
 * operation ID: LedgerAccountList_deleteByIds
 * `DELETE: /ledger/account/list`
 */
export const LedgerAccountList_deleteByIds = buildCall() //
  .args<rt.Static<typeof ledgerAccountList_deleteByIdsArgsRt>>()
  .method('delete')
  .path('/ledger/account/list')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'ids')))
  .build();

// Operation: LedgerAccount_get

const ledgerAccount_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: LedgerAccount_get
 * `GET: /ledger/account/{id}`
 */
export const LedgerAccount_get = buildCall() //
  .args<rt.Static<typeof ledgerAccount_getArgsRt>>()
  .method('get')
  .path((args) => `/ledger/account/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: LedgerAccount_put

const ledgerAccount_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: accountRt }).asPartial().asReadonly(),
);

/**
 * operation ID: LedgerAccount_put
 * `PUT: /ledger/account/{id}`
 */
export const LedgerAccount_put = buildCall() //
  .args<rt.Static<typeof ledgerAccount_putArgsRt>>()
  .method('put')
  .path((args) => `/ledger/account/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: LedgerAccount_delete

const ledgerAccount_deleteArgsRt = rt.Record({ id: rt.Number }).asReadonly();

/**
 * operation ID: LedgerAccount_delete
 * `DELETE: /ledger/account/{id}`
 */
export const LedgerAccount_delete = buildCall() //
  .args<rt.Static<typeof ledgerAccount_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/ledger/account/${args.id}`)
  .build();

// Operation: LedgerAccountingPeriod_get

const ledgerAccountingPeriod_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: LedgerAccountingPeriod_get
 * `GET: /ledger/accountingPeriod/{id}`
 */
export const LedgerAccountingPeriod_get = buildCall() //
  .args<rt.Static<typeof ledgerAccountingPeriod_getArgsRt>>()
  .method('get')
  .path((args) => `/ledger/accountingPeriod/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: LedgerAccountingPeriod_search

const ledgerAccountingPeriod_searchArgsRt = rt
  .Record({
    id: rt.String,
    numberFrom: rt.Number,
    numberTo: rt.Number,
    startFrom: rt.String,
    startTo: rt.String,
    endFrom: rt.String,
    endTo: rt.String,
    count: rt.Number,
    from: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: LedgerAccountingPeriod_search
 * `GET: /ledger/accountingPeriod`
 */
export const LedgerAccountingPeriod_search = buildCall() //
  .args<rt.Static<typeof ledgerAccountingPeriod_searchArgsRt>>()
  .method('get')
  .path('/ledger/accountingPeriod')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'numberFrom',
          'numberTo',
          'startFrom',
          'startTo',
          'endFrom',
          'endTo',
          'count',
          'from',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: LedgerAnnualAccount_get

const ledgerAnnualAccount_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: LedgerAnnualAccount_get
 * `GET: /ledger/annualAccount/{id}`
 */
export const LedgerAnnualAccount_get = buildCall() //
  .args<rt.Static<typeof ledgerAnnualAccount_getArgsRt>>()
  .method('get')
  .path((args) => `/ledger/annualAccount/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: LedgerAnnualAccount_search

const ledgerAnnualAccount_searchArgsRt = rt
  .Record({
    id: rt.String,
    yearFrom: rt.Number,
    yearTo: rt.Number,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: LedgerAnnualAccount_search
 * `GET: /ledger/annualAccount`
 */
export const LedgerAnnualAccount_search = buildCall() //
  .args<rt.Static<typeof ledgerAnnualAccount_searchArgsRt>>()
  .method('get')
  .path('/ledger/annualAccount')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'yearFrom',
          'yearTo',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: LedgerCloseGroup_get

const ledgerCloseGroup_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: LedgerCloseGroup_get
 * `GET: /ledger/closeGroup/{id}`
 */
export const LedgerCloseGroup_get = buildCall() //
  .args<rt.Static<typeof ledgerCloseGroup_getArgsRt>>()
  .method('get')
  .path((args) => `/ledger/closeGroup/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: LedgerCloseGroup_search

const ledgerCloseGroup_searchArgsRt = rt.Intersect(
  rt.Record({ dateFrom: rt.String, dateTo: rt.String }).asReadonly(),
  rt
    .Record({
      id: rt.String,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: LedgerCloseGroup_search
 * `GET: /ledger/closeGroup`
 */
export const LedgerCloseGroup_search = buildCall() //
  .args<rt.Static<typeof ledgerCloseGroup_searchArgsRt>>()
  .method('get')
  .path('/ledger/closeGroup')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'dateFrom',
          'dateTo',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: LedgerPaymentTypeOut_search

const ledgerPaymentTypeOut_searchArgsRt = rt
  .Record({
    id: rt.String,
    description: rt.String,
    isInactive: rt.Boolean,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: LedgerPaymentTypeOut_search
 * `GET: /ledger/paymentTypeOut`
 * This is an API endpoint for getting payment types for
 * outgoing payments. This is equivalent to the section
 * 'Outgoing Payments' under Accounts Settings in Tripletex.
 * These are the payment types listed in supplier invoices, vat
 * returns, salary payments and Tax/ENI
 */
export const LedgerPaymentTypeOut_search = buildCall() //
  .args<rt.Static<typeof ledgerPaymentTypeOut_searchArgsRt>>()
  .method('get')
  .path('/ledger/paymentTypeOut')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'description',
          'isInactive',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: LedgerPaymentTypeOut_post

const ledgerPaymentTypeOut_postArgsRt = rt
  .Record({ body: paymentTypeOutRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: LedgerPaymentTypeOut_post
 * `POST: /ledger/paymentTypeOut`
 */
export const LedgerPaymentTypeOut_post = buildCall() //
  .args<rt.Static<typeof ledgerPaymentTypeOut_postArgsRt>>()
  .method('post')
  .path('/ledger/paymentTypeOut')
  .body((args) => args.body)
  .build();

// Operation: LedgerPaymentTypeOutList_putList

const ledgerPaymentTypeOutList_putListArgsRt = rt
  .Record({ body: rt.Array(paymentTypeOutRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: LedgerPaymentTypeOutList_putList
 * `PUT: /ledger/paymentTypeOut/list`
 */
export const LedgerPaymentTypeOutList_putList = buildCall() //
  .args<rt.Static<typeof ledgerPaymentTypeOutList_putListArgsRt>>()
  .method('put')
  .path('/ledger/paymentTypeOut/list')
  .body((args) => args.body)
  .build();

// Operation: LedgerPaymentTypeOutList_postList

const ledgerPaymentTypeOutList_postListArgsRt = rt
  .Record({ body: rt.Array(paymentTypeOutRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: LedgerPaymentTypeOutList_postList
 * `POST: /ledger/paymentTypeOut/list`
 */
export const LedgerPaymentTypeOutList_postList = buildCall() //
  .args<rt.Static<typeof ledgerPaymentTypeOutList_postListArgsRt>>()
  .method('post')
  .path('/ledger/paymentTypeOut/list')
  .body((args) => args.body)
  .build();

// Operation: LedgerPaymentTypeOut_get

const ledgerPaymentTypeOut_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: LedgerPaymentTypeOut_get
 * `GET: /ledger/paymentTypeOut/{id}`
 */
export const LedgerPaymentTypeOut_get = buildCall() //
  .args<rt.Static<typeof ledgerPaymentTypeOut_getArgsRt>>()
  .method('get')
  .path((args) => `/ledger/paymentTypeOut/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: LedgerPaymentTypeOut_put

const ledgerPaymentTypeOut_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: paymentTypeOutRt }).asPartial().asReadonly(),
);

/**
 * operation ID: LedgerPaymentTypeOut_put
 * `PUT: /ledger/paymentTypeOut/{id}`
 */
export const LedgerPaymentTypeOut_put = buildCall() //
  .args<rt.Static<typeof ledgerPaymentTypeOut_putArgsRt>>()
  .method('put')
  .path((args) => `/ledger/paymentTypeOut/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: LedgerPaymentTypeOut_delete

const ledgerPaymentTypeOut_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: LedgerPaymentTypeOut_delete
 * `DELETE: /ledger/paymentTypeOut/{id}`
 */
export const LedgerPaymentTypeOut_delete = buildCall() //
  .args<rt.Static<typeof ledgerPaymentTypeOut_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/ledger/paymentTypeOut/${args.id}`)
  .build();

// Operation: LedgerPostingOpenPost_openPost

const ledgerPostingOpenPost_openPostArgsRt = rt.Intersect(
  rt.Record({ date: rt.String }).asReadonly(),
  rt
    .Record({
      accountId: rt.Number,
      supplierId: rt.Number,
      customerId: rt.Number,
      employeeId: rt.Number,
      departmentId: rt.Number,
      projectId: rt.Number,
      productId: rt.Number,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: LedgerPostingOpenPost_openPost
 * `GET: /ledger/posting/openPost`
 */
export const LedgerPostingOpenPost_openPost = buildCall() //
  .args<rt.Static<typeof ledgerPostingOpenPost_openPostArgsRt>>()
  .method('get')
  .path('/ledger/posting/openPost')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'date',
          'accountId',
          'supplierId',
          'customerId',
          'employeeId',
          'departmentId',
          'projectId',
          'productId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: LedgerPosting_get

const ledgerPosting_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: LedgerPosting_get
 * `GET: /ledger/posting/{id}`
 */
export const LedgerPosting_get = buildCall() //
  .args<rt.Static<typeof ledgerPosting_getArgsRt>>()
  .method('get')
  .path((args) => `/ledger/posting/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: LedgerPosting_search

const ledgerPosting_searchArgsRt = rt.Intersect(
  rt.Record({ dateFrom: rt.String, dateTo: rt.String }).asReadonly(),
  rt
    .Record({
      openPostings: rt.String,
      accountId: rt.Number,
      supplierId: rt.Number,
      customerId: rt.Number,
      employeeId: rt.Number,
      departmentId: rt.Number,
      projectId: rt.Number,
      productId: rt.Number,
      type: rt.Union(
        rt.Literal('INCOMING_PAYMENT'),
        rt.Literal('INCOMING_PAYMENT_OPPOSITE'),
        rt.Literal('INVOICE_EXPENSE'),
        rt.Literal('OUTGOING_INVOICE_CUSTOMER_POSTING'),
      ),
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: LedgerPosting_search
 * `GET: /ledger/posting`
 */
export const LedgerPosting_search = buildCall() //
  .args<rt.Static<typeof ledgerPosting_searchArgsRt>>()
  .method('get')
  .path('/ledger/posting')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'dateFrom',
          'dateTo',
          'openPostings',
          'accountId',
          'supplierId',
          'customerId',
          'employeeId',
          'departmentId',
          'projectId',
          'productId',
          'type',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: LedgerVatType_get

const ledgerVatType_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: LedgerVatType_get
 * `GET: /ledger/vatType/{id}`
 */
export const LedgerVatType_get = buildCall() //
  .args<rt.Static<typeof ledgerVatType_getArgsRt>>()
  .method('get')
  .path((args) => `/ledger/vatType/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: LedgerVatType_search

const ledgerVatType_searchArgsRt = rt
  .Record({
    id: rt.String,
    number: rt.String,
    typeOfVat: rt.Union(rt.Literal('OUTGOING'), rt.Literal('INCOMING')),
    vatDate: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: LedgerVatType_search
 * `GET: /ledger/vatType`
 */
export const LedgerVatType_search = buildCall() //
  .args<rt.Static<typeof ledgerVatType_searchArgsRt>>()
  .method('get')
  .path('/ledger/vatType')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'number',
          'typeOfVat',
          'vatDate',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: LedgerVoucher_search

const ledgerVoucher_searchArgsRt = rt.Intersect(
  rt.Record({ dateFrom: rt.String, dateTo: rt.String }).asReadonly(),
  rt
    .Record({
      id: rt.String,
      number: rt.String,
      numberFrom: rt.Number,
      numberTo: rt.Number,
      typeId: rt.String,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: LedgerVoucher_search
 * `GET: /ledger/voucher`
 */
export const LedgerVoucher_search = buildCall() //
  .args<rt.Static<typeof ledgerVoucher_searchArgsRt>>()
  .method('get')
  .path('/ledger/voucher')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'number',
          'numberFrom',
          'numberTo',
          'typeId',
          'dateFrom',
          'dateTo',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: LedgerVoucher_post

const ledgerVoucher_postArgsRt = rt
  .Record({ sendToLedger: rt.Boolean, body: voucherRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: LedgerVoucher_post
 * `POST: /ledger/voucher`
 */
export const LedgerVoucher_post = buildCall() //
  .args<rt.Static<typeof ledgerVoucher_postArgsRt>>()
  .method('post')
  .path('/ledger/voucher')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'sendToLedger')))
  .body((args) => args.body)
  .build();

// Operation: LedgerVoucherList_putList

const ledgerVoucherList_putListArgsRt = rt
  .Record({ sendToLedger: rt.Boolean, body: rt.Array(voucherRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: LedgerVoucherList_putList
 * `PUT: /ledger/voucher/list`
 */
export const LedgerVoucherList_putList = buildCall() //
  .args<rt.Static<typeof ledgerVoucherList_putListArgsRt>>()
  .method('put')
  .path('/ledger/voucher/list')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'sendToLedger')))
  .body((args) => args.body)
  .build();

// Operation: LedgerVoucherSendToLedger_sendToLedger

const ledgerVoucherSendToLedger_sendToLedgerArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ version: rt.Number, number: rt.Number }).asPartial().asReadonly(),
);

/**
 * operation ID: LedgerVoucherSendToLedger_sendToLedger
 * `PUT: /ledger/voucher/{id}/:sendToLedger`
 */
export const LedgerVoucherSendToLedger_sendToLedger = buildCall() //
  .args<rt.Static<typeof ledgerVoucherSendToLedger_sendToLedgerArgsRt>>()
  .method('put')
  .path((args) => `/ledger/voucher/${args.id}/:sendToLedger`)
  .query(
    (args) => new URLSearchParams(pickQueryValues(args, 'version', 'number')),
  )
  .build();

// Operation: LedgerVoucherImportDocument_importDocument

const ledgerVoucherImportDocument_importDocumentArgsRt = rt.Intersect(
  rt.Record({ file: rt.Unknown }).asReadonly(),
  rt
    .Record({ description: rt.String, split: rt.Boolean })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: LedgerVoucherImportDocument_importDocument
 * `POST: /ledger/voucher/importDocument`
 */
export const LedgerVoucherImportDocument_importDocument = buildCall() //
  .args<rt.Static<typeof ledgerVoucherImportDocument_importDocumentArgsRt>>()
  .method('post')
  .path('/ledger/voucher/importDocument')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'split')))
  .build();

// Operation: LedgerVoucherNonPosted_nonPosted

const ledgerVoucherNonPosted_nonPostedArgsRt = rt.Intersect(
  rt.Record({ includeNonApproved: rt.Boolean }).asReadonly(),
  rt
    .Record({
      dateFrom: rt.String,
      dateTo: rt.String,
      changedSince: rt.String,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: LedgerVoucherNonPosted_nonPosted
 * `GET: /ledger/voucher/>nonPosted`
 */
export const LedgerVoucherNonPosted_nonPosted = buildCall() //
  .args<rt.Static<typeof ledgerVoucherNonPosted_nonPostedArgsRt>>()
  .method('get')
  .path('/ledger/voucher/>nonPosted')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'dateFrom',
          'dateTo',
          'includeNonApproved',
          'changedSince',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: LedgerVoucherVoucherReception_voucherReception

const ledgerVoucherVoucherReception_voucherReceptionArgsRt = rt
  .Record({
    dateFrom: rt.String,
    dateTo: rt.String,
    searchText: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: LedgerVoucherVoucherReception_voucherReception
 * `GET: /ledger/voucher/>voucherReception`
 */
export const LedgerVoucherVoucherReception_voucherReception = buildCall() //
  .args<
    rt.Static<typeof ledgerVoucherVoucherReception_voucherReceptionArgsRt>
  >()
  .method('get')
  .path('/ledger/voucher/>voucherReception')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'dateFrom',
          'dateTo',
          'searchText',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: LedgerVoucherPdf_downloadPdf

const ledgerVoucherPdf_downloadPdfArgsRt = rt
  .Record({ voucherId: rt.Number })
  .asReadonly();

/**
 * operation ID: LedgerVoucherPdf_downloadPdf
 * `GET: /ledger/voucher/{voucherId}/pdf`
 */
export const LedgerVoucherPdf_downloadPdf = buildCall() //
  .args<rt.Static<typeof ledgerVoucherPdf_downloadPdfArgsRt>>()
  .method('get')
  .path((args) => `/ledger/voucher/${args.voucherId}/pdf`)
  .build();

// Operation: LedgerVoucherPdf_uploadPdf

const ledgerVoucherPdf_uploadPdfArgsRt = rt
  .Record({ voucherId: rt.Number, fileName: rt.String, file: rt.Unknown })
  .asReadonly();

/**
 * operation ID: LedgerVoucherPdf_uploadPdf
 * `POST: /ledger/voucher/{voucherId}/pdf/{fileName}`
 */
export const LedgerVoucherPdf_uploadPdf = buildCall() //
  .args<rt.Static<typeof ledgerVoucherPdf_uploadPdfArgsRt>>()
  .method('post')
  .path((args) => `/ledger/voucher/${args.voucherId}/pdf/${args.fileName}`)
  .build();

// Operation: LedgerVoucherAttachment_uploadAttachment

const ledgerVoucherAttachment_uploadAttachmentArgsRt = rt
  .Record({ voucherId: rt.Number, file: rt.Unknown })
  .asReadonly();

/**
 * operation ID: LedgerVoucherAttachment_uploadAttachment
 * `POST: /ledger/voucher/{voucherId}/attachment`
 */
export const LedgerVoucherAttachment_uploadAttachment = buildCall() //
  .args<rt.Static<typeof ledgerVoucherAttachment_uploadAttachmentArgsRt>>()
  .method('post')
  .path((args) => `/ledger/voucher/${args.voucherId}/attachment`)
  .build();

// Operation: LedgerVoucherAttachment_deleteAttachment

const ledgerVoucherAttachment_deleteAttachmentArgsRt = rt.Intersect(
  rt.Record({ voucherId: rt.Number }).asReadonly(),
  rt
    .Record({ version: rt.Number, sendToInbox: rt.Boolean, split: rt.Boolean })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: LedgerVoucherAttachment_deleteAttachment
 * `DELETE: /ledger/voucher/{voucherId}/attachment`
 */
export const LedgerVoucherAttachment_deleteAttachment = buildCall() //
  .args<rt.Static<typeof ledgerVoucherAttachment_deleteAttachmentArgsRt>>()
  .method('delete')
  .path((args) => `/ledger/voucher/${args.voucherId}/attachment`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'version', 'sendToInbox', 'split'),
      ),
  )
  .build();

// Operation: LedgerVoucherSendToInbox_sendToInbox

const ledgerVoucherSendToInbox_sendToInboxArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt
    .Record({ version: rt.Number, comment: rt.String })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: LedgerVoucherSendToInbox_sendToInbox
 * `PUT: /ledger/voucher/{id}/:sendToInbox`
 */
export const LedgerVoucherSendToInbox_sendToInbox = buildCall() //
  .args<rt.Static<typeof ledgerVoucherSendToInbox_sendToInboxArgsRt>>()
  .method('put')
  .path((args) => `/ledger/voucher/${args.id}/:sendToInbox`)
  .query(
    (args) => new URLSearchParams(pickQueryValues(args, 'version', 'comment')),
  )
  .build();

// Operation: LedgerVoucherImportGbat10_importGbat10

const ledgerVoucherImportGbat10_importGbat10ArgsRt = rt.Intersect(
  rt.Record({ generateVatPostings: rt.Boolean, file: rt.Unknown }).asReadonly(),
  rt.Record({ encoding: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: LedgerVoucherImportGbat10_importGbat10
 * `POST: /ledger/voucher/importGbat10`
 */
export const LedgerVoucherImportGbat10_importGbat10 = buildCall() //
  .args<rt.Static<typeof ledgerVoucherImportGbat10_importGbat10ArgsRt>>()
  .method('post')
  .path('/ledger/voucher/importGbat10')
  .build();

// Operation: LedgerVoucher_get

const ledgerVoucher_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: LedgerVoucher_get
 * `GET: /ledger/voucher/{id}`
 */
export const LedgerVoucher_get = buildCall() //
  .args<rt.Static<typeof ledgerVoucher_getArgsRt>>()
  .method('get')
  .path((args) => `/ledger/voucher/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: LedgerVoucher_put

const ledgerVoucher_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt
    .Record({ sendToLedger: rt.Boolean, body: voucherRt })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: LedgerVoucher_put
 * `PUT: /ledger/voucher/{id}`
 */
export const LedgerVoucher_put = buildCall() //
  .args<rt.Static<typeof ledgerVoucher_putArgsRt>>()
  .method('put')
  .path((args) => `/ledger/voucher/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'sendToLedger')))
  .body((args) => args.body)
  .build();

// Operation: LedgerVoucher_delete

const ledgerVoucher_deleteArgsRt = rt.Record({ id: rt.Number }).asReadonly();

/**
 * operation ID: LedgerVoucher_delete
 * `DELETE: /ledger/voucher/{id}`
 */
export const LedgerVoucher_delete = buildCall() //
  .args<rt.Static<typeof ledgerVoucher_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/ledger/voucher/${args.id}`)
  .build();

// Operation: LedgerVoucherReverse_reverse

const ledgerVoucherReverse_reverseArgsRt = rt
  .Record({ id: rt.Number, date: rt.String })
  .asReadonly();

/**
 * operation ID: LedgerVoucherReverse_reverse
 * `PUT: /ledger/voucher/{id}/:reverse`
 */
export const LedgerVoucherReverse_reverse = buildCall() //
  .args<rt.Static<typeof ledgerVoucherReverse_reverseArgsRt>>()
  .method('put')
  .path((args) => `/ledger/voucher/${args.id}/:reverse`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'date')))
  .build();

// Operation: LedgerVoucherOptions_options

const ledgerVoucherOptions_optionsArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: LedgerVoucherOptions_options
 * `GET: /ledger/voucher/{id}/options`
 */
export const LedgerVoucherOptions_options = buildCall() //
  .args<rt.Static<typeof ledgerVoucherOptions_optionsArgsRt>>()
  .method('get')
  .path((args) => `/ledger/voucher/${args.id}/options`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: LedgerVoucherType_get

const ledgerVoucherType_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: LedgerVoucherType_get
 * `GET: /ledger/voucherType/{id}`
 */
export const LedgerVoucherType_get = buildCall() //
  .args<rt.Static<typeof ledgerVoucherType_getArgsRt>>()
  .method('get')
  .path((args) => `/ledger/voucherType/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: LedgerVoucherType_search

const ledgerVoucherType_searchArgsRt = rt
  .Record({
    name: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: LedgerVoucherType_search
 * `GET: /ledger/voucherType`
 */
export const LedgerVoucherType_search = buildCall() //
  .args<rt.Static<typeof ledgerVoucherType_searchArgsRt>>()
  .method('get')
  .path('/ledger/voucherType')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'name', 'from', 'count', 'sorting', 'fields'),
      ),
  )
  .build();

// Operation: Municipality_search

const municipality_searchArgsRt = rt
  .Record({
    includePayrollTaxZones: rt.Boolean,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Municipality_search
 * `GET: /municipality`
 */
export const Municipality_search = buildCall() //
  .args<rt.Static<typeof municipality_searchArgsRt>>()
  .method('get')
  .path('/municipality')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'includePayrollTaxZones',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: Order_search

const order_searchArgsRt = rt.Intersect(
  rt.Record({ orderDateFrom: rt.String, orderDateTo: rt.String }).asReadonly(),
  rt
    .Record({
      id: rt.String,
      number: rt.String,
      customerId: rt.String,
      isClosed: rt.Boolean,
      isSubscription: rt.Boolean,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: Order_search
 * `GET: /order`
 */
export const Order_search = buildCall() //
  .args<rt.Static<typeof order_searchArgsRt>>()
  .method('get')
  .path('/order')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'number',
          'customerId',
          'orderDateFrom',
          'orderDateTo',
          'isClosed',
          'isSubscription',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: Order_post

const order_postArgsRt = rt.Record({ body: orderRt }).asPartial().asReadonly();

/**
 * operation ID: Order_post
 * `POST: /order`
 */
export const Order_post = buildCall() //
  .args<rt.Static<typeof order_postArgsRt>>()
  .method('post')
  .path('/order')
  .body((args) => args.body)
  .build();

// Operation: OrderList_postList

const orderList_postListArgsRt = rt
  .Record({ body: rt.Array(orderRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: OrderList_postList
 * `POST: /order/list`
 */
export const OrderList_postList = buildCall() //
  .args<rt.Static<typeof orderList_postListArgsRt>>()
  .method('post')
  .path('/order/list')
  .body((args) => args.body)
  .build();

// Operation: OrderInvoice_invoice

const orderInvoice_invoiceArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number, invoiceDate: rt.String }).asReadonly(),
  rt
    .Record({
      sendToCustomer: rt.Boolean,
      paymentTypeId: rt.Number,
      paidAmount: rt.Number,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: OrderInvoice_invoice
 * `PUT: /order/{id}/:invoice`
 */
export const OrderInvoice_invoice = buildCall() //
  .args<rt.Static<typeof orderInvoice_invoiceArgsRt>>()
  .method('put')
  .path((args) => `/order/${args.id}/:invoice`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'invoiceDate',
          'sendToCustomer',
          'paymentTypeId',
          'paidAmount',
        ),
      ),
  )
  .build();

// Operation: OrderInvoiceMultipleOrders_invoiceMultipleOrders

const orderInvoiceMultipleOrders_invoiceMultipleOrdersArgsRt = rt
  .Record({ id: rt.String, invoiceDate: rt.String })
  .asReadonly();

/**
 * operation ID:
 * OrderInvoiceMultipleOrders_invoiceMultipleOrders
 * `PUT: /order/:invoiceMultipleOrders`
 */
export const OrderInvoiceMultipleOrders_invoiceMultipleOrders = buildCall() //
  .args<
    rt.Static<typeof orderInvoiceMultipleOrders_invoiceMultipleOrdersArgsRt>
  >()
  .method('put')
  .path('/order/:invoiceMultipleOrders')
  .query(
    (args) => new URLSearchParams(pickQueryValues(args, 'id', 'invoiceDate')),
  )
  .build();

// Operation: OrderApproveSubscriptionInvoice_approveSubscriptionInvoice

const orderApproveSubscriptionInvoice_approveSubscriptionInvoiceArgsRt = rt
  .Record({ id: rt.Number, invoiceDate: rt.String })
  .asReadonly();

/**
 * operation ID:
 * OrderApproveSubscriptionInvoice_approveSubscriptionInvoice
 * `PUT: /order/{id}/:approveSubscriptionInvoice`
 */
export const OrderApproveSubscriptionInvoice_approveSubscriptionInvoice =
  buildCall() //
    .args<
      rt.Static<
        typeof orderApproveSubscriptionInvoice_approveSubscriptionInvoiceArgsRt
      >
    >()
    .method('put')
    .path((args) => `/order/${args.id}/:approveSubscriptionInvoice`)
    .query((args) => new URLSearchParams(pickQueryValues(args, 'invoiceDate')))
    .build();

// Operation: OrderUnApproveSubscriptionInvoice_unApproveSubscriptionInvoice

const orderUnApproveSubscriptionInvoice_unApproveSubscriptionInvoiceArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID:
 * OrderUnApproveSubscriptionInvoice_unApproveSubscriptionInvoice
 * `PUT: /order/{id}/:unApproveSubscriptionInvoice`
 */
export const OrderUnApproveSubscriptionInvoice_unApproveSubscriptionInvoice =
  buildCall() //
    .args<
      rt.Static<
        typeof orderUnApproveSubscriptionInvoice_unApproveSubscriptionInvoiceArgsRt
      >
    >()
    .method('put')
    .path((args) => `/order/${args.id}/:unApproveSubscriptionInvoice`)
    .build();

// Operation: Order_get

const order_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: Order_get
 * `GET: /order/{id}`
 */
export const Order_get = buildCall() //
  .args<rt.Static<typeof order_getArgsRt>>()
  .method('get')
  .path((args) => `/order/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: Order_put

const order_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: orderRt }).asPartial().asReadonly(),
);

/**
 * operation ID: Order_put
 * `PUT: /order/{id}`
 */
export const Order_put = buildCall() //
  .args<rt.Static<typeof order_putArgsRt>>()
  .method('put')
  .path((args) => `/order/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: OrderAttach_attach

const orderAttach_attachArgsRt = rt
  .Record({ file: rt.Unknown, id: rt.Number })
  .asReadonly();

/**
 * operation ID: OrderAttach_attach
 * `PUT: /order/{id}/:attach`
 */
export const OrderAttach_attach = buildCall() //
  .args<rt.Static<typeof orderAttach_attachArgsRt>>()
  .method('put')
  .path((args) => `/order/${args.id}/:attach`)
  .build();

// Operation: OrderOrderGroup_search

const orderOrderGroup_searchArgsRt = rt
  .Record({
    ids: rt.String,
    orderIds: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: OrderOrderGroup_search
 * `GET: /order/orderGroup`
 */
export const OrderOrderGroup_search = buildCall() //
  .args<rt.Static<typeof orderOrderGroup_searchArgsRt>>()
  .method('get')
  .path('/order/orderGroup')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'ids',
          'orderIds',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: OrderOrderGroup_put

const orderOrderGroup_putArgsRt = rt
  .Record({
    body: orderGroupRt,
    OrderLineIds: rt.String,
    removeExistingOrderLines: rt.Boolean,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: OrderOrderGroup_put
 * `PUT: /order/orderGroup`
 */
export const OrderOrderGroup_put = buildCall() //
  .args<rt.Static<typeof orderOrderGroup_putArgsRt>>()
  .method('put')
  .path('/order/orderGroup')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'OrderLineIds', 'removeExistingOrderLines'),
      ),
  )
  .body((args) => args.body)
  .build();

// Operation: OrderOrderGroup_post

const orderOrderGroup_postArgsRt = rt
  .Record({ body: orderGroupRt, orderLineIds: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: OrderOrderGroup_post
 * `POST: /order/orderGroup`
 */
export const OrderOrderGroup_post = buildCall() //
  .args<rt.Static<typeof orderOrderGroup_postArgsRt>>()
  .method('post')
  .path('/order/orderGroup')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'orderLineIds')))
  .body((args) => args.body)
  .build();

// Operation: OrderOrderGroup_get

const orderOrderGroup_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: OrderOrderGroup_get
 * `GET: /order/orderGroup/{id}`
 */
export const OrderOrderGroup_get = buildCall() //
  .args<rt.Static<typeof orderOrderGroup_getArgsRt>>()
  .method('get')
  .path((args) => `/order/orderGroup/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: OrderOrderGroup_delete

const orderOrderGroup_deleteArgsRt = rt.Record({ id: rt.Number }).asReadonly();

/**
 * operation ID: OrderOrderGroup_delete
 * `DELETE: /order/orderGroup/{id}`
 */
export const OrderOrderGroup_delete = buildCall() //
  .args<rt.Static<typeof orderOrderGroup_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/order/orderGroup/${args.id}`)
  .build();

// Operation: OrderOrderline_post

const orderOrderline_postArgsRt = rt
  .Record({ body: orderLineRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: OrderOrderline_post
 * `POST: /order/orderline`
 */
export const OrderOrderline_post = buildCall() //
  .args<rt.Static<typeof orderOrderline_postArgsRt>>()
  .method('post')
  .path('/order/orderline')
  .body((args) => args.body)
  .build();

// Operation: OrderOrderlineList_postList

const orderOrderlineList_postListArgsRt = rt
  .Record({ body: rt.Array(orderLineRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: OrderOrderlineList_postList
 * `POST: /order/orderline/list`
 */
export const OrderOrderlineList_postList = buildCall() //
  .args<rt.Static<typeof orderOrderlineList_postListArgsRt>>()
  .method('post')
  .path('/order/orderline/list')
  .body((args) => args.body)
  .build();

// Operation: OrderOrderline_get

const orderOrderline_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: OrderOrderline_get
 * `GET: /order/orderline/{id}`
 */
export const OrderOrderline_get = buildCall() //
  .args<rt.Static<typeof orderOrderline_getArgsRt>>()
  .method('get')
  .path((args) => `/order/orderline/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: OrderOrderline_put

const orderOrderline_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: orderLineRt }).asPartial().asReadonly(),
);

/**
 * operation ID: OrderOrderline_put
 * `PUT: /order/orderline/{id}`
 */
export const OrderOrderline_put = buildCall() //
  .args<rt.Static<typeof orderOrderline_putArgsRt>>()
  .method('put')
  .path((args) => `/order/orderline/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: OrderOrderline_delete

const orderOrderline_deleteArgsRt = rt.Record({ id: rt.Number }).asReadonly();

/**
 * operation ID: OrderOrderline_delete
 * `DELETE: /order/orderline/{id}`
 */
export const OrderOrderline_delete = buildCall() //
  .args<rt.Static<typeof orderOrderline_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/order/orderline/${args.id}`)
  .build();

// Operation: ProductExternal_get

const productExternal_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: ProductExternal_get
 * `GET: /product/external/{id}`
 */
export const ProductExternal_get = buildCall() //
  .args<rt.Static<typeof productExternal_getArgsRt>>()
  .method('get')
  .path((args) => `/product/external/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: ProductExternal_search

const productExternal_searchArgsRt = rt
  .Record({
    name: rt.String,
    wholesaler: rt.Union(
      rt.Literal('AHLSELL'),
      rt.Literal('BROEDRENE_DAHL'),
      rt.Literal('ELEKTROSKANDIA'),
      rt.Literal('HEIDENREICH'),
      rt.Literal('ONNINEN'),
      rt.Literal('OTRA'),
      rt.Literal('SOLAR'),
      rt.Literal('BERGAARD_AMUNDSEN'),
      rt.Literal('BERGAARD_AMUNDSEN_STAVANGER'),
      rt.Literal('SORLANDET_ELEKTRO'),
      rt.Literal('ETMAN_DISTRIBUSJON'),
      rt.Literal('ETM_OST'),
      rt.Literal('CENIKA'),
      rt.Literal('EP_ENGROS'),
      rt.Literal('BETEK'),
      rt.Literal('DGROUP'),
      rt.Literal('FAGERHULT'),
      rt.Literal('GLAMOX'),
      rt.Literal('SCHNEIDER'),
      rt.Literal('STOKKAN'),
      rt.Literal('WURTH'),
      rt.Literal('ELEKTROIMPORTOEREN'),
      rt.Literal('THERMOFLOOR'),
      rt.Literal('LYSKOMPONENTER'),
      rt.Literal('NORDESIGN'),
    ),
    organizationNumber: rt.String,
    elNumber: rt.String,
    nrfNumber: rt.String,
    isInactive: rt.Boolean,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductExternal_search
 * `GET: /product/external`
 */
export const ProductExternal_search = buildCall() //
  .args<rt.Static<typeof productExternal_searchArgsRt>>()
  .method('get')
  .path('/product/external')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'name',
          'wholesaler',
          'organizationNumber',
          'elNumber',
          'nrfNumber',
          'isInactive',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: Product_search

const product_searchArgsRt = rt
  .Record({
    number: rt.String,
    productNumber: rt.Array(rt.String),
    name: rt.String,
    ean: rt.String,
    isInactive: rt.Boolean,
    isStockItem: rt.Boolean,
    isSupplierProduct: rt.Boolean,
    supplierId: rt.String,
    currencyId: rt.String,
    vatTypeId: rt.String,
    productUnitId: rt.String,
    departmentId: rt.String,
    accountId: rt.String,
    costExcludingVatCurrencyFrom: rt.Number,
    costExcludingVatCurrencyTo: rt.Number,
    priceExcludingVatCurrencyFrom: rt.Number,
    priceExcludingVatCurrencyTo: rt.Number,
    priceIncludingVatCurrencyFrom: rt.Number,
    priceIncludingVatCurrencyTo: rt.Number,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Product_search
 * `GET: /product`
 */
export const Product_search = buildCall() //
  .args<rt.Static<typeof product_searchArgsRt>>()
  .method('get')
  .path('/product')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'number',
          'productNumber',
          'name',
          'ean',
          'isInactive',
          'isStockItem',
          'isSupplierProduct',
          'supplierId',
          'currencyId',
          'vatTypeId',
          'productUnitId',
          'departmentId',
          'accountId',
          'costExcludingVatCurrencyFrom',
          'costExcludingVatCurrencyTo',
          'priceExcludingVatCurrencyFrom',
          'priceExcludingVatCurrencyTo',
          'priceIncludingVatCurrencyFrom',
          'priceIncludingVatCurrencyTo',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: Product_post

const product_postArgsRt = rt
  .Record({ body: productRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Product_post
 * `POST: /product`
 */
export const Product_post = buildCall() //
  .args<rt.Static<typeof product_postArgsRt>>()
  .method('post')
  .path('/product')
  .body((args) => args.body)
  .build();

// Operation: ProductList_putList

const productList_putListArgsRt = rt
  .Record({ body: rt.Array(productRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductList_putList
 * `PUT: /product/list`
 */
export const ProductList_putList = buildCall() //
  .args<rt.Static<typeof productList_putListArgsRt>>()
  .method('put')
  .path('/product/list')
  .body((args) => args.body)
  .build();

// Operation: ProductList_postList

const productList_postListArgsRt = rt
  .Record({ body: rt.Array(productRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductList_postList
 * `POST: /product/list`
 */
export const ProductList_postList = buildCall() //
  .args<rt.Static<typeof productList_postListArgsRt>>()
  .method('post')
  .path('/product/list')
  .body((args) => args.body)
  .build();

// Operation: Product_get

const product_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: Product_get
 * `GET: /product/{id}`
 */
export const Product_get = buildCall() //
  .args<rt.Static<typeof product_getArgsRt>>()
  .method('get')
  .path((args) => `/product/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: Product_put

const product_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: productRt }).asPartial().asReadonly(),
);

/**
 * operation ID: Product_put
 * `PUT: /product/{id}`
 */
export const Product_put = buildCall() //
  .args<rt.Static<typeof product_putArgsRt>>()
  .method('put')
  .path((args) => `/product/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: Product_delete

const product_deleteArgsRt = rt.Record({ id: rt.Number }).asReadonly();

/**
 * operation ID: Product_delete
 * `DELETE: /product/{id}`
 */
export const Product_delete = buildCall() //
  .args<rt.Static<typeof product_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/product/${args.id}`)
  .build();

// Operation: ProductInventoryLocation_search

const productInventoryLocation_searchArgsRt = rt
  .Record({
    productId: rt.String,
    inventoryId: rt.String,
    isMainLocation: rt.Boolean,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductInventoryLocation_search
 * `GET: /product/inventoryLocation`
 */
export const ProductInventoryLocation_search = buildCall() //
  .args<rt.Static<typeof productInventoryLocation_searchArgsRt>>()
  .method('get')
  .path('/product/inventoryLocation')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'productId',
          'inventoryId',
          'isMainLocation',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: ProductInventoryLocation_post

const productInventoryLocation_postArgsRt = rt
  .Record({ body: productInventoryLocationRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductInventoryLocation_post
 * `POST: /product/inventoryLocation`
 */
export const ProductInventoryLocation_post = buildCall() //
  .args<rt.Static<typeof productInventoryLocation_postArgsRt>>()
  .method('post')
  .path('/product/inventoryLocation')
  .body((args) => args.body)
  .build();

// Operation: ProductInventoryLocationList_putList

const productInventoryLocationList_putListArgsRt = rt
  .Record({ body: rt.Array(productInventoryLocationRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductInventoryLocationList_putList
 * `PUT: /product/inventoryLocation/list`
 */
export const ProductInventoryLocationList_putList = buildCall() //
  .args<rt.Static<typeof productInventoryLocationList_putListArgsRt>>()
  .method('put')
  .path('/product/inventoryLocation/list')
  .body((args) => args.body)
  .build();

// Operation: ProductInventoryLocationList_postList

const productInventoryLocationList_postListArgsRt = rt
  .Record({ body: rt.Array(productInventoryLocationRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductInventoryLocationList_postList
 * `POST: /product/inventoryLocation/list`
 */
export const ProductInventoryLocationList_postList = buildCall() //
  .args<rt.Static<typeof productInventoryLocationList_postListArgsRt>>()
  .method('post')
  .path('/product/inventoryLocation/list')
  .body((args) => args.body)
  .build();

// Operation: ProductInventoryLocation_get

const productInventoryLocation_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: ProductInventoryLocation_get
 * `GET: /product/inventoryLocation/{id}`
 */
export const ProductInventoryLocation_get = buildCall() //
  .args<rt.Static<typeof productInventoryLocation_getArgsRt>>()
  .method('get')
  .path((args) => `/product/inventoryLocation/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: ProductInventoryLocation_put

const productInventoryLocation_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: productInventoryLocationRt }).asPartial().asReadonly(),
);

/**
 * operation ID: ProductInventoryLocation_put
 * `PUT: /product/inventoryLocation/{id}`
 */
export const ProductInventoryLocation_put = buildCall() //
  .args<rt.Static<typeof productInventoryLocation_putArgsRt>>()
  .method('put')
  .path((args) => `/product/inventoryLocation/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: ProductInventoryLocation_delete

const productInventoryLocation_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: ProductInventoryLocation_delete
 * `DELETE: /product/inventoryLocation/{id}`
 */
export const ProductInventoryLocation_delete = buildCall() //
  .args<rt.Static<typeof productInventoryLocation_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/product/inventoryLocation/${args.id}`)
  .build();

// Operation: ProductLogisticsSettings_get

const productLogisticsSettings_getArgsRt = rt
  .Record({ fields: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductLogisticsSettings_get
 * `GET: /product/logisticsSettings`
 */
export const ProductLogisticsSettings_get = buildCall() //
  .args<rt.Static<typeof productLogisticsSettings_getArgsRt>>()
  .method('get')
  .path('/product/logisticsSettings')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: ProductLogisticsSettings_put

const productLogisticsSettings_putArgsRt = rt
  .Record({ body: logisticsSettingsRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductLogisticsSettings_put
 * `PUT: /product/logisticsSettings`
 */
export const ProductLogisticsSettings_put = buildCall() //
  .args<rt.Static<typeof productLogisticsSettings_putArgsRt>>()
  .method('put')
  .path('/product/logisticsSettings')
  .body((args) => args.body)
  .build();

// Operation: ProductGroup_search

const productGroup_searchArgsRt = rt
  .Record({
    id: rt.String,
    name: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductGroup_search
 * `GET: /product/group`
 */
export const ProductGroup_search = buildCall() //
  .args<rt.Static<typeof productGroup_searchArgsRt>>()
  .method('get')
  .path('/product/group')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'name',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: ProductGroup_post

const productGroup_postArgsRt = rt
  .Record({ body: productGroupRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductGroup_post
 * `POST: /product/group`
 */
export const ProductGroup_post = buildCall() //
  .args<rt.Static<typeof productGroup_postArgsRt>>()
  .method('post')
  .path('/product/group')
  .body((args) => args.body)
  .build();

// Operation: ProductGroupList_putList

const productGroupList_putListArgsRt = rt
  .Record({ body: rt.Array(productGroupRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductGroupList_putList
 * `PUT: /product/group/list`
 */
export const ProductGroupList_putList = buildCall() //
  .args<rt.Static<typeof productGroupList_putListArgsRt>>()
  .method('put')
  .path('/product/group/list')
  .body((args) => args.body)
  .build();

// Operation: ProductGroupList_postList

const productGroupList_postListArgsRt = rt
  .Record({ body: rt.Array(productGroupRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductGroupList_postList
 * `POST: /product/group/list`
 */
export const ProductGroupList_postList = buildCall() //
  .args<rt.Static<typeof productGroupList_postListArgsRt>>()
  .method('post')
  .path('/product/group/list')
  .body((args) => args.body)
  .build();

// Operation: ProductGroupList_deleteByIds

const productGroupList_deleteByIdsArgsRt = rt
  .Record({ ids: rt.String })
  .asReadonly();

/**
 * operation ID: ProductGroupList_deleteByIds
 * `DELETE: /product/group/list`
 */
export const ProductGroupList_deleteByIds = buildCall() //
  .args<rt.Static<typeof productGroupList_deleteByIdsArgsRt>>()
  .method('delete')
  .path('/product/group/list')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'ids')))
  .build();

// Operation: ProductGroup_get

const productGroup_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: ProductGroup_get
 * `GET: /product/group/{id}`
 */
export const ProductGroup_get = buildCall() //
  .args<rt.Static<typeof productGroup_getArgsRt>>()
  .method('get')
  .path((args) => `/product/group/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: ProductGroup_put

const productGroup_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: productGroupRt }).asPartial().asReadonly(),
);

/**
 * operation ID: ProductGroup_put
 * `PUT: /product/group/{id}`
 */
export const ProductGroup_put = buildCall() //
  .args<rt.Static<typeof productGroup_putArgsRt>>()
  .method('put')
  .path((args) => `/product/group/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: ProductGroup_delete

const productGroup_deleteArgsRt = rt.Record({ id: rt.Number }).asReadonly();

/**
 * operation ID: ProductGroup_delete
 * `DELETE: /product/group/{id}`
 */
export const ProductGroup_delete = buildCall() //
  .args<rt.Static<typeof productGroup_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/product/group/${args.id}`)
  .build();

// Operation: ProductGroupRelation_search

const productGroupRelation_searchArgsRt = rt
  .Record({
    id: rt.String,
    productId: rt.String,
    productGroupId: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductGroupRelation_search
 * `GET: /product/groupRelation`
 */
export const ProductGroupRelation_search = buildCall() //
  .args<rt.Static<typeof productGroupRelation_searchArgsRt>>()
  .method('get')
  .path('/product/groupRelation')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'productId',
          'productGroupId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: ProductGroupRelation_post

const productGroupRelation_postArgsRt = rt
  .Record({ body: productGroupRelationRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductGroupRelation_post
 * `POST: /product/groupRelation`
 */
export const ProductGroupRelation_post = buildCall() //
  .args<rt.Static<typeof productGroupRelation_postArgsRt>>()
  .method('post')
  .path('/product/groupRelation')
  .body((args) => args.body)
  .build();

// Operation: ProductGroupRelationList_postList

const productGroupRelationList_postListArgsRt = rt
  .Record({ body: rt.Array(productGroupRelationRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductGroupRelationList_postList
 * `POST: /product/groupRelation/list`
 */
export const ProductGroupRelationList_postList = buildCall() //
  .args<rt.Static<typeof productGroupRelationList_postListArgsRt>>()
  .method('post')
  .path('/product/groupRelation/list')
  .body((args) => args.body)
  .build();

// Operation: ProductGroupRelationList_deleteByIds

const productGroupRelationList_deleteByIdsArgsRt = rt
  .Record({ ids: rt.String })
  .asReadonly();

/**
 * operation ID: ProductGroupRelationList_deleteByIds
 * `DELETE: /product/groupRelation/list`
 */
export const ProductGroupRelationList_deleteByIds = buildCall() //
  .args<rt.Static<typeof productGroupRelationList_deleteByIdsArgsRt>>()
  .method('delete')
  .path('/product/groupRelation/list')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'ids')))
  .build();

// Operation: ProductGroupRelation_get

const productGroupRelation_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: ProductGroupRelation_get
 * `GET: /product/groupRelation/{id}`
 */
export const ProductGroupRelation_get = buildCall() //
  .args<rt.Static<typeof productGroupRelation_getArgsRt>>()
  .method('get')
  .path((args) => `/product/groupRelation/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: ProductGroupRelation_delete

const productGroupRelation_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: ProductGroupRelation_delete
 * `DELETE: /product/groupRelation/{id}`
 */
export const ProductGroupRelation_delete = buildCall() //
  .args<rt.Static<typeof productGroupRelation_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/product/groupRelation/${args.id}`)
  .build();

// Operation: ProductProductPrice_search

const productProductPrice_searchArgsRt = rt.Intersect(
  rt.Record({ productId: rt.Number }).asReadonly(),
  rt
    .Record({
      fromDate: rt.String,
      toDate: rt.String,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: ProductProductPrice_search
 * `GET: /product/productPrice`
 */
export const ProductProductPrice_search = buildCall() //
  .args<rt.Static<typeof productProductPrice_searchArgsRt>>()
  .method('get')
  .path('/product/productPrice')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'productId',
          'fromDate',
          'toDate',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: ProductUnit_search

const productUnit_searchArgsRt = rt
  .Record({
    id: rt.String,
    name: rt.String,
    nameShort: rt.String,
    commonCode: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductUnit_search
 * `GET: /product/unit`
 */
export const ProductUnit_search = buildCall() //
  .args<rt.Static<typeof productUnit_searchArgsRt>>()
  .method('get')
  .path('/product/unit')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'name',
          'nameShort',
          'commonCode',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: ProductUnit_post

const productUnit_postArgsRt = rt
  .Record({ body: productUnitRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductUnit_post
 * `POST: /product/unit`
 */
export const ProductUnit_post = buildCall() //
  .args<rt.Static<typeof productUnit_postArgsRt>>()
  .method('post')
  .path('/product/unit')
  .body((args) => args.body)
  .build();

// Operation: ProductUnitList_putList

const productUnitList_putListArgsRt = rt
  .Record({ body: rt.Array(productUnitRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductUnitList_putList
 * `PUT: /product/unit/list`
 */
export const ProductUnitList_putList = buildCall() //
  .args<rt.Static<typeof productUnitList_putListArgsRt>>()
  .method('put')
  .path('/product/unit/list')
  .body((args) => args.body)
  .build();

// Operation: ProductUnitList_postList

const productUnitList_postListArgsRt = rt
  .Record({ body: rt.Array(productUnitRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductUnitList_postList
 * `POST: /product/unit/list`
 */
export const ProductUnitList_postList = buildCall() //
  .args<rt.Static<typeof productUnitList_postListArgsRt>>()
  .method('post')
  .path('/product/unit/list')
  .body((args) => args.body)
  .build();

// Operation: ProductUnit_get

const productUnit_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: ProductUnit_get
 * `GET: /product/unit/{id}`
 */
export const ProductUnit_get = buildCall() //
  .args<rt.Static<typeof productUnit_getArgsRt>>()
  .method('get')
  .path((args) => `/product/unit/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: ProductUnit_put

const productUnit_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: productUnitRt }).asPartial().asReadonly(),
);

/**
 * operation ID: ProductUnit_put
 * `PUT: /product/unit/{id}`
 */
export const ProductUnit_put = buildCall() //
  .args<rt.Static<typeof productUnit_putArgsRt>>()
  .method('put')
  .path((args) => `/product/unit/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: ProductUnit_delete

const productUnit_deleteArgsRt = rt.Record({ id: rt.Number }).asReadonly();

/**
 * operation ID: ProductUnit_delete
 * `DELETE: /product/unit/{id}`
 */
export const ProductUnit_delete = buildCall() //
  .args<rt.Static<typeof productUnit_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/product/unit/${args.id}`)
  .build();

// Operation: ProductUnitMaster_get

const productUnitMaster_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: ProductUnitMaster_get
 * `GET: /product/unit/master/{id}`
 */
export const ProductUnitMaster_get = buildCall() //
  .args<rt.Static<typeof productUnitMaster_getArgsRt>>()
  .method('get')
  .path((args) => `/product/unit/master/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: ProductUnitMaster_search

const productUnitMaster_searchArgsRt = rt
  .Record({
    id: rt.String,
    name: rt.String,
    nameShort: rt.String,
    commonCode: rt.String,
    peppolName: rt.String,
    peppolSymbol: rt.String,
    isInactive: rt.Boolean,
    count: rt.Number,
    from: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProductUnitMaster_search
 * `GET: /product/unit/master`
 */
export const ProductUnitMaster_search = buildCall() //
  .args<rt.Static<typeof productUnitMaster_searchArgsRt>>()
  .method('get')
  .path('/product/unit/master')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'name',
          'nameShort',
          'commonCode',
          'peppolName',
          'peppolSymbol',
          'isInactive',
          'count',
          'from',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: Project_search

const project_searchArgsRt = rt
  .Record({
    id: rt.String,
    name: rt.String,
    number: rt.String,
    isOffer: rt.Boolean,
    projectManagerId: rt.String,
    employeeInProjectId: rt.String,
    departmentId: rt.String,
    startDateFrom: rt.String,
    startDateTo: rt.String,
    endDateFrom: rt.String,
    endDateTo: rt.String,
    isClosed: rt.Boolean,
    customerId: rt.String,
    externalAccountsNumber: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Project_search
 * `GET: /project`
 */
export const Project_search = buildCall() //
  .args<rt.Static<typeof project_searchArgsRt>>()
  .method('get')
  .path('/project')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'name',
          'number',
          'isOffer',
          'projectManagerId',
          'employeeInProjectId',
          'departmentId',
          'startDateFrom',
          'startDateTo',
          'endDateFrom',
          'endDateTo',
          'isClosed',
          'customerId',
          'externalAccountsNumber',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: Project_post

const project_postArgsRt = rt
  .Record({ body: projectRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Project_post
 * `POST: /project`
 */
export const Project_post = buildCall() //
  .args<rt.Static<typeof project_postArgsRt>>()
  .method('post')
  .path('/project')
  .body((args) => args.body)
  .build();

// Operation: Project_deleteList

const project_deleteListArgsRt = rt
  .Record({ body: rt.Array(projectRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Project_deleteList
 * `DELETE: /project`
 */
export const Project_deleteList = buildCall() //
  .args<rt.Static<typeof project_deleteListArgsRt>>()
  .method('delete')
  .path('/project')
  .body((args) => args.body)
  .build();

// Operation: ProjectList_putList

const projectList_putListArgsRt = rt
  .Record({ body: rt.Array(projectRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProjectList_putList
 * `PUT: /project/list`
 */
export const ProjectList_putList = buildCall() //
  .args<rt.Static<typeof projectList_putListArgsRt>>()
  .method('put')
  .path('/project/list')
  .body((args) => args.body)
  .build();

// Operation: ProjectList_postList

const projectList_postListArgsRt = rt
  .Record({ body: rt.Array(projectRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProjectList_postList
 * `POST: /project/list`
 */
export const ProjectList_postList = buildCall() //
  .args<rt.Static<typeof projectList_postListArgsRt>>()
  .method('post')
  .path('/project/list')
  .body((args) => args.body)
  .build();

// Operation: ProjectList_deleteByIds

const projectList_deleteByIdsArgsRt = rt
  .Record({ ids: rt.String })
  .asReadonly();

/**
 * operation ID: ProjectList_deleteByIds
 * `DELETE: /project/list`
 */
export const ProjectList_deleteByIds = buildCall() //
  .args<rt.Static<typeof projectList_deleteByIdsArgsRt>>()
  .method('delete')
  .path('/project/list')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'ids')))
  .build();

// Operation: ProjectForTimeSheet_getForTimeSheet

const projectForTimeSheet_getForTimeSheetArgsRt = rt
  .Record({
    employeeId: rt.Number,
    date: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProjectForTimeSheet_getForTimeSheet
 * `GET: /project/>forTimeSheet`
 */
export const ProjectForTimeSheet_getForTimeSheet = buildCall() //
  .args<rt.Static<typeof projectForTimeSheet_getForTimeSheetArgsRt>>()
  .method('get')
  .path('/project/>forTimeSheet')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'employeeId',
          'date',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: ProjectImport_importProjectStatement

const projectImport_importProjectStatementArgsRt = rt.Intersect(
  rt
    .Record({
      fileFormat: rt.Union(rt.Literal('XLS'), rt.Literal('CSV')),
      file: rt.Unknown,
    })
    .asReadonly(),
  rt
    .Record({
      encoding: rt.String,
      delimiter: rt.String,
      ignoreFirstRow: rt.Boolean,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: ProjectImport_importProjectStatement
 * `POST: /project/import`
 */
export const ProjectImport_importProjectStatement = buildCall() //
  .args<rt.Static<typeof projectImport_importProjectStatementArgsRt>>()
  .method('post')
  .path('/project/import')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'fileFormat',
          'encoding',
          'delimiter',
          'ignoreFirstRow',
        ),
      ),
  )
  .build();

// Operation: Project_get

const project_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: Project_get
 * `GET: /project/{id}`
 */
export const Project_get = buildCall() //
  .args<rt.Static<typeof project_getArgsRt>>()
  .method('get')
  .path((args) => `/project/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: Project_put

const project_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: projectRt }).asPartial().asReadonly(),
);

/**
 * operation ID: Project_put
 * `PUT: /project/{id}`
 */
export const Project_put = buildCall() //
  .args<rt.Static<typeof project_putArgsRt>>()
  .method('put')
  .path((args) => `/project/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: Project_delete

const project_deleteArgsRt = rt.Record({ id: rt.Number }).asReadonly();

/**
 * operation ID: Project_delete
 * `DELETE: /project/{id}`
 */
export const Project_delete = buildCall() //
  .args<rt.Static<typeof project_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/project/${args.id}`)
  .build();

// Operation: ProjectCategory_search

const projectCategory_searchArgsRt = rt
  .Record({
    id: rt.String,
    name: rt.String,
    number: rt.String,
    description: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProjectCategory_search
 * `GET: /project/category`
 */
export const ProjectCategory_search = buildCall() //
  .args<rt.Static<typeof projectCategory_searchArgsRt>>()
  .method('get')
  .path('/project/category')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'name',
          'number',
          'description',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: ProjectCategory_post

const projectCategory_postArgsRt = rt
  .Record({ body: projectCategoryRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProjectCategory_post
 * `POST: /project/category`
 */
export const ProjectCategory_post = buildCall() //
  .args<rt.Static<typeof projectCategory_postArgsRt>>()
  .method('post')
  .path('/project/category')
  .body((args) => args.body)
  .build();

// Operation: ProjectCategory_get

const projectCategory_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: ProjectCategory_get
 * `GET: /project/category/{id}`
 */
export const ProjectCategory_get = buildCall() //
  .args<rt.Static<typeof projectCategory_getArgsRt>>()
  .method('get')
  .path((args) => `/project/category/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: ProjectCategory_put

const projectCategory_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: projectCategoryRt }).asPartial().asReadonly(),
);

/**
 * operation ID: ProjectCategory_put
 * `PUT: /project/category/{id}`
 */
export const ProjectCategory_put = buildCall() //
  .args<rt.Static<typeof projectCategory_putArgsRt>>()
  .method('put')
  .path((args) => `/project/category/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: ProjectOrderline_search

const projectOrderline_searchArgsRt = rt.Intersect(
  rt.Record({ projectId: rt.Number }).asReadonly(),
  rt
    .Record({
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: ProjectOrderline_search
 * `GET: /project/orderline`
 */
export const ProjectOrderline_search = buildCall() //
  .args<rt.Static<typeof projectOrderline_searchArgsRt>>()
  .method('get')
  .path('/project/orderline')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'projectId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: ProjectOrderline_post

const projectOrderline_postArgsRt = rt
  .Record({ body: projectOrderLineRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProjectOrderline_post
 * `POST: /project/orderline`
 */
export const ProjectOrderline_post = buildCall() //
  .args<rt.Static<typeof projectOrderline_postArgsRt>>()
  .method('post')
  .path('/project/orderline')
  .body((args) => args.body)
  .build();

// Operation: ProjectOrderlineList_postList

const projectOrderlineList_postListArgsRt = rt
  .Record({ body: rt.Array(projectOrderLineRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProjectOrderlineList_postList
 * `POST: /project/orderline/list`
 */
export const ProjectOrderlineList_postList = buildCall() //
  .args<rt.Static<typeof projectOrderlineList_postListArgsRt>>()
  .method('post')
  .path('/project/orderline/list')
  .body((args) => args.body)
  .build();

// Operation: ProjectOrderline_get

const projectOrderline_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: ProjectOrderline_get
 * `GET: /project/orderline/{id}`
 */
export const ProjectOrderline_get = buildCall() //
  .args<rt.Static<typeof projectOrderline_getArgsRt>>()
  .method('get')
  .path((args) => `/project/orderline/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: ProjectOrderline_put

const projectOrderline_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: projectOrderLineRt }).asPartial().asReadonly(),
);

/**
 * operation ID: ProjectOrderline_put
 * `PUT: /project/orderline/{id}`
 */
export const ProjectOrderline_put = buildCall() //
  .args<rt.Static<typeof projectOrderline_putArgsRt>>()
  .method('put')
  .path((args) => `/project/orderline/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: ProjectOrderline_delete

const projectOrderline_deleteArgsRt = rt.Record({ id: rt.Number }).asReadonly();

/**
 * operation ID: ProjectOrderline_delete
 * `DELETE: /project/orderline/{id}`
 */
export const ProjectOrderline_delete = buildCall() //
  .args<rt.Static<typeof projectOrderline_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/project/orderline/${args.id}`)
  .build();

// Operation: ProjectParticipant_post

const projectParticipant_postArgsRt = rt
  .Record({ body: projectParticipantRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProjectParticipant_post
 * `POST: /project/participant`
 */
export const ProjectParticipant_post = buildCall() //
  .args<rt.Static<typeof projectParticipant_postArgsRt>>()
  .method('post')
  .path('/project/participant')
  .body((args) => args.body)
  .build();

// Operation: ProjectParticipantList_postList

const projectParticipantList_postListArgsRt = rt
  .Record({ body: rt.Array(projectParticipantRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProjectParticipantList_postList
 * `POST: /project/participant/list`
 */
export const ProjectParticipantList_postList = buildCall() //
  .args<rt.Static<typeof projectParticipantList_postListArgsRt>>()
  .method('post')
  .path('/project/participant/list')
  .body((args) => args.body)
  .build();

// Operation: ProjectParticipantList_deleteByIds

const projectParticipantList_deleteByIdsArgsRt = rt
  .Record({ ids: rt.String })
  .asReadonly();

/**
 * operation ID: ProjectParticipantList_deleteByIds
 * `DELETE: /project/participant/list`
 */
export const ProjectParticipantList_deleteByIds = buildCall() //
  .args<rt.Static<typeof projectParticipantList_deleteByIdsArgsRt>>()
  .method('delete')
  .path('/project/participant/list')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'ids')))
  .build();

// Operation: ProjectParticipant_get

const projectParticipant_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: ProjectParticipant_get
 * `GET: /project/participant/{id}`
 */
export const ProjectParticipant_get = buildCall() //
  .args<rt.Static<typeof projectParticipant_getArgsRt>>()
  .method('get')
  .path((args) => `/project/participant/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: ProjectParticipant_put

const projectParticipant_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: projectParticipantRt }).asPartial().asReadonly(),
);

/**
 * operation ID: ProjectParticipant_put
 * `PUT: /project/participant/{id}`
 */
export const ProjectParticipant_put = buildCall() //
  .args<rt.Static<typeof projectParticipant_putArgsRt>>()
  .method('put')
  .path((args) => `/project/participant/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: ProjectPeriodInvoicingReserve_invoicingReserve

const projectPeriodInvoicingReserve_invoicingReserveArgsRt = rt.Intersect(
  rt
    .Record({ dateFrom: rt.String, dateTo: rt.String, id: rt.Number })
    .asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: ProjectPeriodInvoicingReserve_invoicingReserve
 * `GET: /project/{id}/period/invoicingReserve`
 */
export const ProjectPeriodInvoicingReserve_invoicingReserve = buildCall() //
  .args<
    rt.Static<typeof projectPeriodInvoicingReserve_invoicingReserveArgsRt>
  >()
  .method('get')
  .path((args) => `/project/${args.id}/period/invoicingReserve`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'dateFrom', 'dateTo', 'fields'),
      ),
  )
  .build();

// Operation: ProjectPeriodInvoiced_invoiced

const projectPeriodInvoiced_invoicedArgsRt = rt.Intersect(
  rt
    .Record({ dateFrom: rt.String, dateTo: rt.String, id: rt.Number })
    .asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: ProjectPeriodInvoiced_invoiced
 * `GET: /project/{id}/period/invoiced`
 */
export const ProjectPeriodInvoiced_invoiced = buildCall() //
  .args<rt.Static<typeof projectPeriodInvoiced_invoicedArgsRt>>()
  .method('get')
  .path((args) => `/project/${args.id}/period/invoiced`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'dateFrom', 'dateTo', 'fields'),
      ),
  )
  .build();

// Operation: ProjectPeriodOverallStatus_overallStatus

const projectPeriodOverallStatus_overallStatusArgsRt = rt.Intersect(
  rt
    .Record({ dateFrom: rt.String, dateTo: rt.String, id: rt.Number })
    .asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: ProjectPeriodOverallStatus_overallStatus
 * `GET: /project/{id}/period/overallStatus`
 */
export const ProjectPeriodOverallStatus_overallStatus = buildCall() //
  .args<rt.Static<typeof projectPeriodOverallStatus_overallStatusArgsRt>>()
  .method('get')
  .path((args) => `/project/${args.id}/period/overallStatus`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'dateFrom', 'dateTo', 'fields'),
      ),
  )
  .build();

// Operation: ProjectPeriodMonthlyStatus_monthlyStatus

const projectPeriodMonthlyStatus_monthlyStatusArgsRt = rt.Intersect(
  rt
    .Record({ dateFrom: rt.String, dateTo: rt.String, id: rt.Number })
    .asReadonly(),
  rt
    .Record({
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: ProjectPeriodMonthlyStatus_monthlyStatus
 * `GET: /project/{id}/period/monthlyStatus`
 */
export const ProjectPeriodMonthlyStatus_monthlyStatus = buildCall() //
  .args<rt.Static<typeof projectPeriodMonthlyStatus_monthlyStatusArgsRt>>()
  .method('get')
  .path((args) => `/project/${args.id}/period/monthlyStatus`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'dateFrom',
          'dateTo',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: ProjectPeriodHourlistReport_hourlistReport

const projectPeriodHourlistReport_hourlistReportArgsRt = rt.Intersect(
  rt
    .Record({ dateFrom: rt.String, dateTo: rt.String, id: rt.Number })
    .asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: ProjectPeriodHourlistReport_hourlistReport
 * `GET: /project/{id}/period/hourlistReport`
 */
export const ProjectPeriodHourlistReport_hourlistReport = buildCall() //
  .args<rt.Static<typeof projectPeriodHourlistReport_hourlistReportArgsRt>>()
  .method('get')
  .path((args) => `/project/${args.id}/period/hourlistReport`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'dateFrom', 'dateTo', 'fields'),
      ),
  )
  .build();

// Operation: ProjectProjectActivity_post

const projectProjectActivity_postArgsRt = rt
  .Record({ body: projectActivityRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProjectProjectActivity_post
 * `POST: /project/projectActivity`
 */
export const ProjectProjectActivity_post = buildCall() //
  .args<rt.Static<typeof projectProjectActivity_postArgsRt>>()
  .method('post')
  .path('/project/projectActivity')
  .body((args) => args.body)
  .build();

// Operation: ProjectProjectActivityList_deleteByIds

const projectProjectActivityList_deleteByIdsArgsRt = rt
  .Record({ ids: rt.String })
  .asReadonly();

/**
 * operation ID: ProjectProjectActivityList_deleteByIds
 * `DELETE: /project/projectActivity/list`
 */
export const ProjectProjectActivityList_deleteByIds = buildCall() //
  .args<rt.Static<typeof projectProjectActivityList_deleteByIdsArgsRt>>()
  .method('delete')
  .path('/project/projectActivity/list')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'ids')))
  .build();

// Operation: ProjectProjectActivity_get

const projectProjectActivity_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: ProjectProjectActivity_get
 * `GET: /project/projectActivity/{id}`
 */
export const ProjectProjectActivity_get = buildCall() //
  .args<rt.Static<typeof projectProjectActivity_getArgsRt>>()
  .method('get')
  .path((args) => `/project/projectActivity/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: ProjectProjectActivity_delete

const projectProjectActivity_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: ProjectProjectActivity_delete
 * `DELETE: /project/projectActivity/{id}`
 */
export const ProjectProjectActivity_delete = buildCall() //
  .args<rt.Static<typeof projectProjectActivity_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/project/projectActivity/${args.id}`)
  .build();

// Operation: ProjectControlForm_get

const projectControlForm_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: ProjectControlForm_get
 * `GET: /project/controlForm/{id}`
 */
export const ProjectControlForm_get = buildCall() //
  .args<rt.Static<typeof projectControlForm_getArgsRt>>()
  .method('get')
  .path((args) => `/project/controlForm/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: ProjectControlForm_search

const projectControlForm_searchArgsRt = rt.Intersect(
  rt.Record({ projectId: rt.Number }).asReadonly(),
  rt
    .Record({
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: ProjectControlForm_search
 * `GET: /project/controlForm`
 */
export const ProjectControlForm_search = buildCall() //
  .args<rt.Static<typeof projectControlForm_searchArgsRt>>()
  .method('get')
  .path('/project/controlForm')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'projectId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: ProjectControlFormType_get

const projectControlFormType_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: ProjectControlFormType_get
 * `GET: /project/controlFormType/{id}`
 */
export const ProjectControlFormType_get = buildCall() //
  .args<rt.Static<typeof projectControlFormType_getArgsRt>>()
  .method('get')
  .path((args) => `/project/controlFormType/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: ProjectControlFormType_search

const projectControlFormType_searchArgsRt = rt
  .Record({
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProjectControlFormType_search
 * `GET: /project/controlFormType`
 */
export const ProjectControlFormType_search = buildCall() //
  .args<rt.Static<typeof projectControlFormType_searchArgsRt>>()
  .method('get')
  .path('/project/controlFormType')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'from', 'count', 'sorting', 'fields'),
      ),
  )
  .build();

// Operation: ProjectHourlyRates_search

const projectHourlyRates_searchArgsRt = rt
  .Record({
    id: rt.String,
    projectId: rt.String,
    type: rt.Union(
      rt.Literal('TYPE_PREDEFINED_HOURLY_RATES'),
      rt.Literal('TYPE_PROJECT_SPECIFIC_HOURLY_RATES'),
      rt.Literal('TYPE_FIXED_HOURLY_RATE'),
    ),
    startDateFrom: rt.String,
    startDateTo: rt.String,
    showInProjectOrder: rt.Boolean,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProjectHourlyRates_search
 * `GET: /project/hourlyRates`
 */
export const ProjectHourlyRates_search = buildCall() //
  .args<rt.Static<typeof projectHourlyRates_searchArgsRt>>()
  .method('get')
  .path('/project/hourlyRates')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'projectId',
          'type',
          'startDateFrom',
          'startDateTo',
          'showInProjectOrder',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: ProjectHourlyRates_post

const projectHourlyRates_postArgsRt = rt
  .Record({ body: projectHourlyRateRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProjectHourlyRates_post
 * `POST: /project/hourlyRates`
 */
export const ProjectHourlyRates_post = buildCall() //
  .args<rt.Static<typeof projectHourlyRates_postArgsRt>>()
  .method('post')
  .path('/project/hourlyRates')
  .body((args) => args.body)
  .build();

// Operation: ProjectHourlyRatesList_putList

const projectHourlyRatesList_putListArgsRt = rt
  .Record({ body: rt.Array(projectHourlyRateRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProjectHourlyRatesList_putList
 * `PUT: /project/hourlyRates/list`
 */
export const ProjectHourlyRatesList_putList = buildCall() //
  .args<rt.Static<typeof projectHourlyRatesList_putListArgsRt>>()
  .method('put')
  .path('/project/hourlyRates/list')
  .body((args) => args.body)
  .build();

// Operation: ProjectHourlyRatesList_postList

const projectHourlyRatesList_postListArgsRt = rt
  .Record({ body: rt.Array(projectHourlyRateRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProjectHourlyRatesList_postList
 * `POST: /project/hourlyRates/list`
 */
export const ProjectHourlyRatesList_postList = buildCall() //
  .args<rt.Static<typeof projectHourlyRatesList_postListArgsRt>>()
  .method('post')
  .path('/project/hourlyRates/list')
  .body((args) => args.body)
  .build();

// Operation: ProjectHourlyRatesList_deleteByIds

const projectHourlyRatesList_deleteByIdsArgsRt = rt
  .Record({ ids: rt.String })
  .asReadonly();

/**
 * operation ID: ProjectHourlyRatesList_deleteByIds
 * `DELETE: /project/hourlyRates/list`
 */
export const ProjectHourlyRatesList_deleteByIds = buildCall() //
  .args<rt.Static<typeof projectHourlyRatesList_deleteByIdsArgsRt>>()
  .method('delete')
  .path('/project/hourlyRates/list')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'ids')))
  .build();

// Operation: ProjectHourlyRates_get

const projectHourlyRates_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: ProjectHourlyRates_get
 * `GET: /project/hourlyRates/{id}`
 */
export const ProjectHourlyRates_get = buildCall() //
  .args<rt.Static<typeof projectHourlyRates_getArgsRt>>()
  .method('get')
  .path((args) => `/project/hourlyRates/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: ProjectHourlyRates_put

const projectHourlyRates_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: projectHourlyRateRt }).asPartial().asReadonly(),
);

/**
 * operation ID: ProjectHourlyRates_put
 * `PUT: /project/hourlyRates/{id}`
 */
export const ProjectHourlyRates_put = buildCall() //
  .args<rt.Static<typeof projectHourlyRates_putArgsRt>>()
  .method('put')
  .path((args) => `/project/hourlyRates/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: ProjectHourlyRates_delete

const projectHourlyRates_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: ProjectHourlyRates_delete
 * `DELETE: /project/hourlyRates/{id}`
 */
export const ProjectHourlyRates_delete = buildCall() //
  .args<rt.Static<typeof projectHourlyRates_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/project/hourlyRates/${args.id}`)
  .build();

// Operation: ProjectHourlyRatesProjectSpecificRates_search

const projectHourlyRatesProjectSpecificRates_searchArgsRt = rt
  .Record({
    id: rt.String,
    projectHourlyRateId: rt.String,
    employeeId: rt.String,
    activityId: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProjectHourlyRatesProjectSpecificRates_search
 * `GET: /project/hourlyRates/projectSpecificRates`
 */
export const ProjectHourlyRatesProjectSpecificRates_search = buildCall() //
  .args<rt.Static<typeof projectHourlyRatesProjectSpecificRates_searchArgsRt>>()
  .method('get')
  .path('/project/hourlyRates/projectSpecificRates')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'projectHourlyRateId',
          'employeeId',
          'activityId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: ProjectHourlyRatesProjectSpecificRates_post

const projectHourlyRatesProjectSpecificRates_postArgsRt = rt
  .Record({ body: projectSpecificRateRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProjectHourlyRatesProjectSpecificRates_post
 * `POST: /project/hourlyRates/projectSpecificRates`
 */
export const ProjectHourlyRatesProjectSpecificRates_post = buildCall() //
  .args<rt.Static<typeof projectHourlyRatesProjectSpecificRates_postArgsRt>>()
  .method('post')
  .path('/project/hourlyRates/projectSpecificRates')
  .body((args) => args.body)
  .build();

// Operation: ProjectHourlyRatesProjectSpecificRatesList_putList

const projectHourlyRatesProjectSpecificRatesList_putListArgsRt = rt
  .Record({ body: rt.Array(projectSpecificRateRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID:
 * ProjectHourlyRatesProjectSpecificRatesList_putList
 * `PUT: /project/hourlyRates/projectSpecificRates/list`
 */
export const ProjectHourlyRatesProjectSpecificRatesList_putList = buildCall() //
  .args<
    rt.Static<typeof projectHourlyRatesProjectSpecificRatesList_putListArgsRt>
  >()
  .method('put')
  .path('/project/hourlyRates/projectSpecificRates/list')
  .body((args) => args.body)
  .build();

// Operation: ProjectHourlyRatesProjectSpecificRatesList_postList

const projectHourlyRatesProjectSpecificRatesList_postListArgsRt = rt
  .Record({ body: rt.Array(projectSpecificRateRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID:
 * ProjectHourlyRatesProjectSpecificRatesList_postList
 * `POST: /project/hourlyRates/projectSpecificRates/list`
 */
export const ProjectHourlyRatesProjectSpecificRatesList_postList = buildCall() //
  .args<
    rt.Static<typeof projectHourlyRatesProjectSpecificRatesList_postListArgsRt>
  >()
  .method('post')
  .path('/project/hourlyRates/projectSpecificRates/list')
  .body((args) => args.body)
  .build();

// Operation: ProjectHourlyRatesProjectSpecificRatesList_deleteByIds

const projectHourlyRatesProjectSpecificRatesList_deleteByIdsArgsRt = rt
  .Record({ ids: rt.String })
  .asReadonly();

/**
 * operation ID:
 * ProjectHourlyRatesProjectSpecificRatesList_deleteByIds
 * `DELETE: /project/hourlyRates/projectSpecificRates/list`
 */
export const ProjectHourlyRatesProjectSpecificRatesList_deleteByIds =
  buildCall() //
    .args<
      rt.Static<
        typeof projectHourlyRatesProjectSpecificRatesList_deleteByIdsArgsRt
      >
    >()
    .method('delete')
    .path('/project/hourlyRates/projectSpecificRates/list')
    .query((args) => new URLSearchParams(pickQueryValues(args, 'ids')))
    .build();

// Operation: ProjectHourlyRatesProjectSpecificRates_get

const projectHourlyRatesProjectSpecificRates_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: ProjectHourlyRatesProjectSpecificRates_get
 * `GET: /project/hourlyRates/projectSpecificRates/{id}`
 */
export const ProjectHourlyRatesProjectSpecificRates_get = buildCall() //
  .args<rt.Static<typeof projectHourlyRatesProjectSpecificRates_getArgsRt>>()
  .method('get')
  .path((args) => `/project/hourlyRates/projectSpecificRates/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: ProjectHourlyRatesProjectSpecificRates_put

const projectHourlyRatesProjectSpecificRates_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: projectSpecificRateRt }).asPartial().asReadonly(),
);

/**
 * operation ID: ProjectHourlyRatesProjectSpecificRates_put
 * `PUT: /project/hourlyRates/projectSpecificRates/{id}`
 */
export const ProjectHourlyRatesProjectSpecificRates_put = buildCall() //
  .args<rt.Static<typeof projectHourlyRatesProjectSpecificRates_putArgsRt>>()
  .method('put')
  .path((args) => `/project/hourlyRates/projectSpecificRates/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: ProjectHourlyRatesProjectSpecificRates_delete

const projectHourlyRatesProjectSpecificRates_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: ProjectHourlyRatesProjectSpecificRates_delete
 * `DELETE: /project/hourlyRates/projectSpecificRates/{id}`
 */
export const ProjectHourlyRatesProjectSpecificRates_delete = buildCall() //
  .args<rt.Static<typeof projectHourlyRatesProjectSpecificRates_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/project/hourlyRates/projectSpecificRates/${args.id}`)
  .build();

// Operation: ProjectSettings_get

const projectSettings_getArgsRt = rt
  .Record({ fields: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProjectSettings_get
 * `GET: /project/settings`
 */
export const ProjectSettings_get = buildCall() //
  .args<rt.Static<typeof projectSettings_getArgsRt>>()
  .method('get')
  .path('/project/settings')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: ProjectSettings_put

const projectSettings_putArgsRt = rt
  .Record({ body: projectSettingsRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ProjectSettings_put
 * `PUT: /project/settings`
 */
export const ProjectSettings_put = buildCall() //
  .args<rt.Static<typeof projectSettings_putArgsRt>>()
  .method('put')
  .path('/project/settings')
  .body((args) => args.body)
  .build();

// Operation: ProjectTask_search

const projectTask_searchArgsRt = rt.Intersect(
  rt.Record({ projectId: rt.Number }).asReadonly(),
  rt
    .Record({
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: ProjectTask_search
 * `GET: /project/task`
 */
export const ProjectTask_search = buildCall() //
  .args<rt.Static<typeof projectTask_searchArgsRt>>()
  .method('get')
  .path('/project/task')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'projectId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: ProjectTemplate_get

const projectTemplate_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: ProjectTemplate_get
 * `GET: /project/template/{id}`
 */
export const ProjectTemplate_get = buildCall() //
  .args<rt.Static<typeof projectTemplate_getArgsRt>>()
  .method('get')
  .path((args) => `/project/template/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: CrmProspect_search

const crmProspect_searchArgsRt = rt
  .Record({
    name: rt.String,
    description: rt.String,
    createdDateFrom: rt.String,
    createdDateTo: rt.String,
    customerId: rt.String,
    salesEmployeeId: rt.String,
    isClosed: rt.Boolean,
    closedReason: rt.String,
    closedDateFrom: rt.String,
    closedDateTo: rt.String,
    competitor: rt.String,
    prospectType: rt.String,
    projectId: rt.String,
    projectOfferId: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: CrmProspect_search
 * `GET: /crm/prospect`
 */
export const CrmProspect_search = buildCall() //
  .args<rt.Static<typeof crmProspect_searchArgsRt>>()
  .method('get')
  .path('/crm/prospect')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'name',
          'description',
          'createdDateFrom',
          'createdDateTo',
          'customerId',
          'salesEmployeeId',
          'isClosed',
          'closedReason',
          'closedDateFrom',
          'closedDateTo',
          'competitor',
          'prospectType',
          'projectId',
          'projectOfferId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: CrmProspect_get

const crmProspect_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: CrmProspect_get
 * `GET: /crm/prospect/{id}`
 */
export const CrmProspect_get = buildCall() //
  .args<rt.Static<typeof crmProspect_getArgsRt>>()
  .method('get')
  .path((args) => `/crm/prospect/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: PickupPoint_get

const pickupPoint_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: PickupPoint_get
 * `GET: /pickupPoint/{id}`
 */
export const PickupPoint_get = buildCall() //
  .args<rt.Static<typeof pickupPoint_getArgsRt>>()
  .method('get')
  .path((args) => `/pickupPoint/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: PickupPoint_search

const pickupPoint_searchArgsRt = rt
  .Record({
    supplierId: rt.Array(rt.Number),
    transportTypeId: rt.Array(rt.Number),
    code: rt.String,
    name: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: PickupPoint_search
 * `GET: /pickupPoint`
 */
export const PickupPoint_search = buildCall() //
  .args<rt.Static<typeof pickupPoint_searchArgsRt>>()
  .method('get')
  .path('/pickupPoint')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'supplierId',
          'transportTypeId',
          'code',
          'name',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: PurchaseOrder_search

const purchaseOrder_searchArgsRt = rt
  .Record({
    number: rt.String,
    deliveryDateFrom: rt.String,
    deliveryDateTo: rt.String,
    creationDateFrom: rt.String,
    creationDateTo: rt.String,
    id: rt.String,
    supplierId: rt.String,
    projectId: rt.String,
    isClosed: rt.Boolean,
    withDeviationOnly: rt.Boolean,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: PurchaseOrder_search
 * `GET: /purchaseOrder`
 */
export const PurchaseOrder_search = buildCall() //
  .args<rt.Static<typeof purchaseOrder_searchArgsRt>>()
  .method('get')
  .path('/purchaseOrder')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'number',
          'deliveryDateFrom',
          'deliveryDateTo',
          'creationDateFrom',
          'creationDateTo',
          'id',
          'supplierId',
          'projectId',
          'isClosed',
          'withDeviationOnly',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: PurchaseOrder_post

const purchaseOrder_postArgsRt = rt
  .Record({ body: purchaseOrderRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: PurchaseOrder_post
 * `POST: /purchaseOrder`
 */
export const PurchaseOrder_post = buildCall() //
  .args<rt.Static<typeof purchaseOrder_postArgsRt>>()
  .method('post')
  .path('/purchaseOrder')
  .body((args) => args.body)
  .build();

// Operation: PurchaseOrderAttachment_uploadAttachment

const purchaseOrderAttachment_uploadAttachmentArgsRt = rt
  .Record({ id: rt.Number, file: rt.Unknown })
  .asReadonly();

/**
 * operation ID: PurchaseOrderAttachment_uploadAttachment
 * `POST: /purchaseOrder/{id}/attachment`
 */
export const PurchaseOrderAttachment_uploadAttachment = buildCall() //
  .args<rt.Static<typeof purchaseOrderAttachment_uploadAttachmentArgsRt>>()
  .method('post')
  .path((args) => `/purchaseOrder/${args.id}/attachment`)
  .build();

// Operation: PurchaseOrderSend_send

const purchaseOrderSend_sendArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt
    .Record({
      sendType: rt.Union(
        rt.Literal('DEFAULT'),
        rt.Literal('EMAIL'),
        rt.Literal('FTP'),
      ),
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: PurchaseOrderSend_send
 * `PUT: /purchaseOrder/{id}/:send`
 */
export const PurchaseOrderSend_send = buildCall() //
  .args<rt.Static<typeof purchaseOrderSend_sendArgsRt>>()
  .method('put')
  .path((args) => `/purchaseOrder/${args.id}/:send`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'sendType')))
  .build();

// Operation: PurchaseOrderSendByEmail_sendByEmail

const purchaseOrderSendByEmail_sendByEmailArgsRt = rt.Intersect(
  rt
    .Record({ id: rt.Number, emailAddress: rt.String, subject: rt.String })
    .asReadonly(),
  rt.Record({ message: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: PurchaseOrderSendByEmail_sendByEmail
 * `PUT: /purchaseOrder/{id}/:sendByEmail`
 */
export const PurchaseOrderSendByEmail_sendByEmail = buildCall() //
  .args<rt.Static<typeof purchaseOrderSendByEmail_sendByEmailArgsRt>>()
  .method('put')
  .path((args) => `/purchaseOrder/${args.id}/:sendByEmail`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'emailAddress', 'subject', 'message'),
      ),
  )
  .build();

// Operation: PurchaseOrder_get

const purchaseOrder_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: PurchaseOrder_get
 * `GET: /purchaseOrder/{id}`
 */
export const PurchaseOrder_get = buildCall() //
  .args<rt.Static<typeof purchaseOrder_getArgsRt>>()
  .method('get')
  .path((args) => `/purchaseOrder/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: PurchaseOrder_put

const purchaseOrder_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: purchaseOrderRt }).asPartial().asReadonly(),
);

/**
 * operation ID: PurchaseOrder_put
 * `PUT: /purchaseOrder/{id}`
 */
export const PurchaseOrder_put = buildCall() //
  .args<rt.Static<typeof purchaseOrder_putArgsRt>>()
  .method('put')
  .path((args) => `/purchaseOrder/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: PurchaseOrder_delete

const purchaseOrder_deleteArgsRt = rt.Record({ id: rt.Number }).asReadonly();

/**
 * operation ID: PurchaseOrder_delete
 * `DELETE: /purchaseOrder/{id}`
 */
export const PurchaseOrder_delete = buildCall() //
  .args<rt.Static<typeof purchaseOrder_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/purchaseOrder/${args.id}`)
  .build();

// Operation: TransportType_get

const transportType_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: TransportType_get
 * `GET: /transportType/{id}`
 */
export const TransportType_get = buildCall() //
  .args<rt.Static<typeof transportType_getArgsRt>>()
  .method('get')
  .path((args) => `/transportType/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TransportType_search

const transportType_searchArgsRt = rt
  .Record({
    supplierId: rt.Array(rt.Number),
    name: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TransportType_search
 * `GET: /transportType`
 */
export const TransportType_search = buildCall() //
  .args<rt.Static<typeof transportType_searchArgsRt>>()
  .method('get')
  .path('/transportType')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'supplierId',
          'name',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: PurchaseOrderDeviation_search

const purchaseOrderDeviation_searchArgsRt = rt.Intersect(
  rt.Record({ purchaseOrderId: rt.Number }).asReadonly(),
  rt
    .Record({
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: PurchaseOrderDeviation_search
 * `GET: /purchaseOrder/deviation`
 */
export const PurchaseOrderDeviation_search = buildCall() //
  .args<rt.Static<typeof purchaseOrderDeviation_searchArgsRt>>()
  .method('get')
  .path('/purchaseOrder/deviation')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'purchaseOrderId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: PurchaseOrderDeviation_post

const purchaseOrderDeviation_postArgsRt = rt
  .Record({ body: deviationRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: PurchaseOrderDeviation_post
 * `POST: /purchaseOrder/deviation`
 */
export const PurchaseOrderDeviation_post = buildCall() //
  .args<rt.Static<typeof purchaseOrderDeviation_postArgsRt>>()
  .method('post')
  .path('/purchaseOrder/deviation')
  .body((args) => args.body)
  .build();

// Operation: PurchaseOrderDeviationList_putList

const purchaseOrderDeviationList_putListArgsRt = rt
  .Record({ body: rt.Array(deviationRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: PurchaseOrderDeviationList_putList
 * `PUT: /purchaseOrder/deviation/list`
 */
export const PurchaseOrderDeviationList_putList = buildCall() //
  .args<rt.Static<typeof purchaseOrderDeviationList_putListArgsRt>>()
  .method('put')
  .path('/purchaseOrder/deviation/list')
  .body((args) => args.body)
  .build();

// Operation: PurchaseOrderDeviationList_postList

const purchaseOrderDeviationList_postListArgsRt = rt
  .Record({ body: rt.Array(deviationRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: PurchaseOrderDeviationList_postList
 * `POST: /purchaseOrder/deviation/list`
 */
export const PurchaseOrderDeviationList_postList = buildCall() //
  .args<rt.Static<typeof purchaseOrderDeviationList_postListArgsRt>>()
  .method('post')
  .path('/purchaseOrder/deviation/list')
  .body((args) => args.body)
  .build();

// Operation: PurchaseOrderDeviationApprove_approve

const purchaseOrderDeviationApprove_approveArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: PurchaseOrderDeviationApprove_approve
 * `PUT: /purchaseOrder/deviation/{id}/:approve`
 */
export const PurchaseOrderDeviationApprove_approve = buildCall() //
  .args<rt.Static<typeof purchaseOrderDeviationApprove_approveArgsRt>>()
  .method('put')
  .path((args) => `/purchaseOrder/deviation/${args.id}/:approve`)
  .build();

// Operation: PurchaseOrderDeviationDeliver_deliver

const purchaseOrderDeviationDeliver_deliverArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: PurchaseOrderDeviationDeliver_deliver
 * `PUT: /purchaseOrder/deviation/{id}/:deliver`
 */
export const PurchaseOrderDeviationDeliver_deliver = buildCall() //
  .args<rt.Static<typeof purchaseOrderDeviationDeliver_deliverArgsRt>>()
  .method('put')
  .path((args) => `/purchaseOrder/deviation/${args.id}/:deliver`)
  .build();

// Operation: PurchaseOrderDeviationUndeliver_undeliver

const purchaseOrderDeviationUndeliver_undeliverArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: PurchaseOrderDeviationUndeliver_undeliver
 * `PUT: /purchaseOrder/deviation/{id}/:undeliver`
 */
export const PurchaseOrderDeviationUndeliver_undeliver = buildCall() //
  .args<rt.Static<typeof purchaseOrderDeviationUndeliver_undeliverArgsRt>>()
  .method('put')
  .path((args) => `/purchaseOrder/deviation/${args.id}/:undeliver`)
  .build();

// Operation: PurchaseOrderDeviation_get

const purchaseOrderDeviation_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: PurchaseOrderDeviation_get
 * `GET: /purchaseOrder/deviation/{id}`
 */
export const PurchaseOrderDeviation_get = buildCall() //
  .args<rt.Static<typeof purchaseOrderDeviation_getArgsRt>>()
  .method('get')
  .path((args) => `/purchaseOrder/deviation/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: PurchaseOrderDeviation_put

const purchaseOrderDeviation_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: deviationRt }).asPartial().asReadonly(),
);

/**
 * operation ID: PurchaseOrderDeviation_put
 * `PUT: /purchaseOrder/deviation/{id}`
 */
export const PurchaseOrderDeviation_put = buildCall() //
  .args<rt.Static<typeof purchaseOrderDeviation_putArgsRt>>()
  .method('put')
  .path((args) => `/purchaseOrder/deviation/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: PurchaseOrderDeviation_delete

const purchaseOrderDeviation_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: PurchaseOrderDeviation_delete
 * `DELETE: /purchaseOrder/deviation/{id}`
 */
export const PurchaseOrderDeviation_delete = buildCall() //
  .args<rt.Static<typeof purchaseOrderDeviation_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/purchaseOrder/deviation/${args.id}`)
  .build();

// Operation: PurchaseOrderGoodsReceipt_search

const purchaseOrderGoodsReceipt_searchArgsRt = rt
  .Record({
    receivedDateFrom: rt.String,
    receivedDateTo: rt.String,
    status: rt.Union(rt.Literal('STATUS_OPEN'), rt.Literal('STATUS_CONFIRMED')),
    withoutPurchase: rt.Boolean,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: PurchaseOrderGoodsReceipt_search
 * `GET: /purchaseOrder/goodsReceipt`
 */
export const PurchaseOrderGoodsReceipt_search = buildCall() //
  .args<rt.Static<typeof purchaseOrderGoodsReceipt_searchArgsRt>>()
  .method('get')
  .path('/purchaseOrder/goodsReceipt')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'receivedDateFrom',
          'receivedDateTo',
          'status',
          'withoutPurchase',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: PurchaseOrderGoodsReceipt_post

const purchaseOrderGoodsReceipt_postArgsRt = rt
  .Record({ body: goodsReceiptRt, fields: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: PurchaseOrderGoodsReceipt_post
 * `POST: /purchaseOrder/goodsReceipt`
 */
export const PurchaseOrderGoodsReceipt_post = buildCall() //
  .args<rt.Static<typeof purchaseOrderGoodsReceipt_postArgsRt>>()
  .method('post')
  .path('/purchaseOrder/goodsReceipt')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .body((args) => args.body)
  .build();

// Operation: PurchaseOrderGoodsReceiptList_postList

const purchaseOrderGoodsReceiptList_postListArgsRt = rt
  .Record({ body: rt.Array(goodsReceiptRt), fields: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: PurchaseOrderGoodsReceiptList_postList
 * `POST: /purchaseOrder/goodsReceipt/list`
 */
export const PurchaseOrderGoodsReceiptList_postList = buildCall() //
  .args<rt.Static<typeof purchaseOrderGoodsReceiptList_postListArgsRt>>()
  .method('post')
  .path('/purchaseOrder/goodsReceipt/list')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .body((args) => args.body)
  .build();

// Operation: PurchaseOrderGoodsReceiptList_deleteByIds

const purchaseOrderGoodsReceiptList_deleteByIdsArgsRt = rt
  .Record({ ids: rt.String })
  .asReadonly();

/**
 * operation ID: PurchaseOrderGoodsReceiptList_deleteByIds
 * `DELETE: /purchaseOrder/goodsReceipt/list`
 */
export const PurchaseOrderGoodsReceiptList_deleteByIds = buildCall() //
  .args<rt.Static<typeof purchaseOrderGoodsReceiptList_deleteByIdsArgsRt>>()
  .method('delete')
  .path('/purchaseOrder/goodsReceipt/list')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'ids')))
  .build();

// Operation: PurchaseOrderGoodsReceiptRegisterGoodsReceipt_registerGoodsReceipt

const purchaseOrderGoodsReceiptRegisterGoodsReceipt_registerGoodsReceiptArgsRt =
  rt.Intersect(
    rt.Record({ id: rt.Number, registrationDate: rt.String }).asReadonly(),
    rt
      .Record({ inventoryId: rt.Number, fields: rt.String })
      .asPartial()
      .asReadonly(),
  );

/**
 * operation ID:
 * PurchaseOrderGoodsReceiptRegisterGoodsReceipt_registerGoodsReceipt
 * `PUT:
 * /purchaseOrder/goodsReceipt/{id}/:registerGoodsReceipt`
 */
export const PurchaseOrderGoodsReceiptRegisterGoodsReceipt_registerGoodsReceipt =
  buildCall() //
    .args<
      rt.Static<
        typeof purchaseOrderGoodsReceiptRegisterGoodsReceipt_registerGoodsReceiptArgsRt
      >
    >()
    .method('put')
    .path(
      (args) => `/purchaseOrder/goodsReceipt/${args.id}/:registerGoodsReceipt`,
    )
    .query(
      (args) =>
        new URLSearchParams(
          pickQueryValues(args, 'registrationDate', 'inventoryId', 'fields'),
        ),
    )
    .build();

// Operation: PurchaseOrderGoodsReceiptConfirm_confirm

const purchaseOrderGoodsReceiptConfirm_confirmArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt
    .Record({ createRestOrder: rt.Boolean, fields: rt.String })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: PurchaseOrderGoodsReceiptConfirm_confirm
 * `PUT: /purchaseOrder/goodsReceipt/{id}/:confirm`
 */
export const PurchaseOrderGoodsReceiptConfirm_confirm = buildCall() //
  .args<rt.Static<typeof purchaseOrderGoodsReceiptConfirm_confirmArgsRt>>()
  .method('put')
  .path((args) => `/purchaseOrder/goodsReceipt/${args.id}/:confirm`)
  .query(
    (args) =>
      new URLSearchParams(pickQueryValues(args, 'createRestOrder', 'fields')),
  )
  .build();

// Operation: PurchaseOrderGoodsReceiptReceiveAndConfirm_receiveAndConfirm

const purchaseOrderGoodsReceiptReceiveAndConfirm_receiveAndConfirmArgsRt =
  rt.Intersect(
    rt.Record({ id: rt.Number, receivedDate: rt.String }).asReadonly(),
    rt
      .Record({ inventoryId: rt.Number, fields: rt.String })
      .asPartial()
      .asReadonly(),
  );

/**
 * operation ID:
 * PurchaseOrderGoodsReceiptReceiveAndConfirm_receiveAndConfirm
 * `PUT: /purchaseOrder/goodsReceipt/{id}/:receiveAndConfirm`
 */
export const PurchaseOrderGoodsReceiptReceiveAndConfirm_receiveAndConfirm =
  buildCall() //
    .args<
      rt.Static<
        typeof purchaseOrderGoodsReceiptReceiveAndConfirm_receiveAndConfirmArgsRt
      >
    >()
    .method('put')
    .path((args) => `/purchaseOrder/goodsReceipt/${args.id}/:receiveAndConfirm`)
    .query(
      (args) =>
        new URLSearchParams(
          pickQueryValues(args, 'receivedDate', 'inventoryId', 'fields'),
        ),
    )
    .build();

// Operation: PurchaseOrderGoodsReceipt_get

const purchaseOrderGoodsReceipt_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: PurchaseOrderGoodsReceipt_get
 * `GET: /purchaseOrder/goodsReceipt/{id}`
 */
export const PurchaseOrderGoodsReceipt_get = buildCall() //
  .args<rt.Static<typeof purchaseOrderGoodsReceipt_getArgsRt>>()
  .method('get')
  .path((args) => `/purchaseOrder/goodsReceipt/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: PurchaseOrderGoodsReceipt_put

const purchaseOrderGoodsReceipt_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt
    .Record({ body: goodsReceiptRt, fields: rt.String })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: PurchaseOrderGoodsReceipt_put
 * `PUT: /purchaseOrder/goodsReceipt/{id}`
 */
export const PurchaseOrderGoodsReceipt_put = buildCall() //
  .args<rt.Static<typeof purchaseOrderGoodsReceipt_putArgsRt>>()
  .method('put')
  .path((args) => `/purchaseOrder/goodsReceipt/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .body((args) => args.body)
  .build();

// Operation: PurchaseOrderGoodsReceipt_delete

const purchaseOrderGoodsReceipt_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: PurchaseOrderGoodsReceipt_delete
 * `DELETE: /purchaseOrder/goodsReceipt/{id}`
 */
export const PurchaseOrderGoodsReceipt_delete = buildCall() //
  .args<rt.Static<typeof purchaseOrderGoodsReceipt_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/purchaseOrder/goodsReceipt/${args.id}`)
  .build();

// Operation: PurchaseOrderGoodsReceiptLine_search

const purchaseOrderGoodsReceiptLine_searchArgsRt = rt.Intersect(
  rt.Record({ purchaseOrderId: rt.Number }).asReadonly(),
  rt
    .Record({
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: PurchaseOrderGoodsReceiptLine_search
 * `GET: /purchaseOrder/goodsReceiptLine`
 */
export const PurchaseOrderGoodsReceiptLine_search = buildCall() //
  .args<rt.Static<typeof purchaseOrderGoodsReceiptLine_searchArgsRt>>()
  .method('get')
  .path('/purchaseOrder/goodsReceiptLine')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'purchaseOrderId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: PurchaseOrderGoodsReceiptLine_post

const purchaseOrderGoodsReceiptLine_postArgsRt = rt
  .Record({ body: goodsReceiptLineRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: PurchaseOrderGoodsReceiptLine_post
 * `POST: /purchaseOrder/goodsReceiptLine`
 */
export const PurchaseOrderGoodsReceiptLine_post = buildCall() //
  .args<rt.Static<typeof purchaseOrderGoodsReceiptLine_postArgsRt>>()
  .method('post')
  .path('/purchaseOrder/goodsReceiptLine')
  .body((args) => args.body)
  .build();

// Operation: PurchaseOrderGoodsReceiptLineList_putList

const purchaseOrderGoodsReceiptLineList_putListArgsRt = rt
  .Record({ body: rt.Array(goodsReceiptLineRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: PurchaseOrderGoodsReceiptLineList_putList
 * `PUT: /purchaseOrder/goodsReceiptLine/list`
 */
export const PurchaseOrderGoodsReceiptLineList_putList = buildCall() //
  .args<rt.Static<typeof purchaseOrderGoodsReceiptLineList_putListArgsRt>>()
  .method('put')
  .path('/purchaseOrder/goodsReceiptLine/list')
  .body((args) => args.body)
  .build();

// Operation: PurchaseOrderGoodsReceiptLineList_postList

const purchaseOrderGoodsReceiptLineList_postListArgsRt = rt
  .Record({ body: rt.Array(goodsReceiptLineRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: PurchaseOrderGoodsReceiptLineList_postList
 * `POST: /purchaseOrder/goodsReceiptLine/list`
 */
export const PurchaseOrderGoodsReceiptLineList_postList = buildCall() //
  .args<rt.Static<typeof purchaseOrderGoodsReceiptLineList_postListArgsRt>>()
  .method('post')
  .path('/purchaseOrder/goodsReceiptLine/list')
  .body((args) => args.body)
  .build();

// Operation: PurchaseOrderGoodsReceiptLineList_deleteList

const purchaseOrderGoodsReceiptLineList_deleteListArgsRt = rt
  .Record({ body: rt.Array(goodsReceiptLineRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: PurchaseOrderGoodsReceiptLineList_deleteList
 * `DELETE: /purchaseOrder/goodsReceiptLine/list`
 */
export const PurchaseOrderGoodsReceiptLineList_deleteList = buildCall() //
  .args<rt.Static<typeof purchaseOrderGoodsReceiptLineList_deleteListArgsRt>>()
  .method('delete')
  .path('/purchaseOrder/goodsReceiptLine/list')
  .body((args) => args.body)
  .build();

// Operation: PurchaseOrderGoodsReceiptLine_get

const purchaseOrderGoodsReceiptLine_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: PurchaseOrderGoodsReceiptLine_get
 * `GET: /purchaseOrder/goodsReceiptLine/{id}`
 */
export const PurchaseOrderGoodsReceiptLine_get = buildCall() //
  .args<rt.Static<typeof purchaseOrderGoodsReceiptLine_getArgsRt>>()
  .method('get')
  .path((args) => `/purchaseOrder/goodsReceiptLine/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: PurchaseOrderGoodsReceiptLine_put

const purchaseOrderGoodsReceiptLine_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: goodsReceiptLineRt }).asPartial().asReadonly(),
);

/**
 * operation ID: PurchaseOrderGoodsReceiptLine_put
 * `PUT: /purchaseOrder/goodsReceiptLine/{id}`
 */
export const PurchaseOrderGoodsReceiptLine_put = buildCall() //
  .args<rt.Static<typeof purchaseOrderGoodsReceiptLine_putArgsRt>>()
  .method('put')
  .path((args) => `/purchaseOrder/goodsReceiptLine/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: PurchaseOrderGoodsReceiptLine_delete

const purchaseOrderGoodsReceiptLine_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: PurchaseOrderGoodsReceiptLine_delete
 * `DELETE: /purchaseOrder/goodsReceiptLine/{id}`
 */
export const PurchaseOrderGoodsReceiptLine_delete = buildCall() //
  .args<rt.Static<typeof purchaseOrderGoodsReceiptLine_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/purchaseOrder/goodsReceiptLine/${args.id}`)
  .build();

// Operation: PurchaseOrderPurchaseOrderIncomingInvoiceRelation_search

const purchaseOrderPurchaseOrderIncomingInvoiceRelation_searchArgsRt = rt
  .Record({
    id: rt.String,
    orderOutId: rt.String,
    voucherId: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID:
 * PurchaseOrderPurchaseOrderIncomingInvoiceRelation_search
 * `GET: /purchaseOrder/purchaseOrderIncomingInvoiceRelation`
 */
export const PurchaseOrderPurchaseOrderIncomingInvoiceRelation_search =
  buildCall() //
    .args<
      rt.Static<
        typeof purchaseOrderPurchaseOrderIncomingInvoiceRelation_searchArgsRt
      >
    >()
    .method('get')
    .path('/purchaseOrder/purchaseOrderIncomingInvoiceRelation')
    .query(
      (args) =>
        new URLSearchParams(
          pickQueryValues(
            args,
            'id',
            'orderOutId',
            'voucherId',
            'from',
            'count',
            'sorting',
            'fields',
          ),
        ),
    )
    .build();

// Operation: PurchaseOrderPurchaseOrderIncomingInvoiceRelation_post

const purchaseOrderPurchaseOrderIncomingInvoiceRelation_postArgsRt = rt
  .Record({ body: purchaseOrderIncomingInvoiceRelationRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID:
 * PurchaseOrderPurchaseOrderIncomingInvoiceRelation_post
 * `POST: /purchaseOrder/purchaseOrderIncomingInvoiceRelation`
 */
export const PurchaseOrderPurchaseOrderIncomingInvoiceRelation_post =
  buildCall() //
    .args<
      rt.Static<
        typeof purchaseOrderPurchaseOrderIncomingInvoiceRelation_postArgsRt
      >
    >()
    .method('post')
    .path('/purchaseOrder/purchaseOrderIncomingInvoiceRelation')
    .body((args) => args.body)
    .build();

// Operation: PurchaseOrderPurchaseOrderIncomingInvoiceRelationList_postList

const purchaseOrderPurchaseOrderIncomingInvoiceRelationList_postListArgsRt = rt
  .Record({ body: rt.Array(purchaseOrderIncomingInvoiceRelationRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID:
 * PurchaseOrderPurchaseOrderIncomingInvoiceRelationList_postList
 * `POST:
 * /purchaseOrder/purchaseOrderIncomingInvoiceRelation/list`
 */
export const PurchaseOrderPurchaseOrderIncomingInvoiceRelationList_postList =
  buildCall() //
    .args<
      rt.Static<
        typeof purchaseOrderPurchaseOrderIncomingInvoiceRelationList_postListArgsRt
      >
    >()
    .method('post')
    .path('/purchaseOrder/purchaseOrderIncomingInvoiceRelation/list')
    .body((args) => args.body)
    .build();

// Operation: PurchaseOrderPurchaseOrderIncomingInvoiceRelationList_deleteByIds

const purchaseOrderPurchaseOrderIncomingInvoiceRelationList_deleteByIdsArgsRt =
  rt.Record({ ids: rt.String }).asReadonly();

/**
 * operation ID:
 * PurchaseOrderPurchaseOrderIncomingInvoiceRelationList_deleteByIds
 * `DELETE:
 * /purchaseOrder/purchaseOrderIncomingInvoiceRelation/list`
 */
export const PurchaseOrderPurchaseOrderIncomingInvoiceRelationList_deleteByIds =
  buildCall() //
    .args<
      rt.Static<
        typeof purchaseOrderPurchaseOrderIncomingInvoiceRelationList_deleteByIdsArgsRt
      >
    >()
    .method('delete')
    .path('/purchaseOrder/purchaseOrderIncomingInvoiceRelation/list')
    .query((args) => new URLSearchParams(pickQueryValues(args, 'ids')))
    .build();

// Operation: PurchaseOrderPurchaseOrderIncomingInvoiceRelation_get

const purchaseOrderPurchaseOrderIncomingInvoiceRelation_getArgsRt =
  rt.Intersect(
    rt.Record({ id: rt.Number }).asReadonly(),
    rt.Record({ fields: rt.String }).asPartial().asReadonly(),
  );

/**
 * operation ID:
 * PurchaseOrderPurchaseOrderIncomingInvoiceRelation_get
 * `GET:
 * /purchaseOrder/purchaseOrderIncomingInvoiceRelation/{id}`
 */
export const PurchaseOrderPurchaseOrderIncomingInvoiceRelation_get = buildCall() //
  .args<
    rt.Static<
      typeof purchaseOrderPurchaseOrderIncomingInvoiceRelation_getArgsRt
    >
  >()
  .method('get')
  .path(
    (args) => `/purchaseOrder/purchaseOrderIncomingInvoiceRelation/${args.id}`,
  )
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: PurchaseOrderPurchaseOrderIncomingInvoiceRelation_delete

const purchaseOrderPurchaseOrderIncomingInvoiceRelation_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID:
 * PurchaseOrderPurchaseOrderIncomingInvoiceRelation_delete
 * `DELETE:
 * /purchaseOrder/purchaseOrderIncomingInvoiceRelation/{id}`
 */
export const PurchaseOrderPurchaseOrderIncomingInvoiceRelation_delete =
  buildCall() //
    .args<
      rt.Static<
        typeof purchaseOrderPurchaseOrderIncomingInvoiceRelation_deleteArgsRt
      >
    >()
    .method('delete')
    .path(
      (args) =>
        `/purchaseOrder/purchaseOrderIncomingInvoiceRelation/${args.id}`,
    )
    .build();

// Operation: PurchaseOrderOrderline_post

const purchaseOrderOrderline_postArgsRt = rt
  .Record({ body: purchaseOrderlineRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: PurchaseOrderOrderline_post
 * `POST: /purchaseOrder/orderline`
 */
export const PurchaseOrderOrderline_post = buildCall() //
  .args<rt.Static<typeof purchaseOrderOrderline_postArgsRt>>()
  .method('post')
  .path('/purchaseOrder/orderline')
  .body((args) => args.body)
  .build();

// Operation: PurchaseOrderOrderline_get

const purchaseOrderOrderline_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: PurchaseOrderOrderline_get
 * `GET: /purchaseOrder/orderline/{id}`
 */
export const PurchaseOrderOrderline_get = buildCall() //
  .args<rt.Static<typeof purchaseOrderOrderline_getArgsRt>>()
  .method('get')
  .path((args) => `/purchaseOrder/orderline/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: PurchaseOrderOrderline_put

const purchaseOrderOrderline_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: purchaseOrderlineRt }).asPartial().asReadonly(),
);

/**
 * operation ID: PurchaseOrderOrderline_put
 * `PUT: /purchaseOrder/orderline/{id}`
 */
export const PurchaseOrderOrderline_put = buildCall() //
  .args<rt.Static<typeof purchaseOrderOrderline_putArgsRt>>()
  .method('put')
  .path((args) => `/purchaseOrder/orderline/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: PurchaseOrderOrderline_delete

const purchaseOrderOrderline_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: PurchaseOrderOrderline_delete
 * `DELETE: /purchaseOrder/orderline/{id}`
 */
export const PurchaseOrderOrderline_delete = buildCall() //
  .args<rt.Static<typeof purchaseOrderOrderline_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/purchaseOrder/orderline/${args.id}`)
  .build();

// Operation: Reminder_get

const reminder_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: Reminder_get
 * `GET: /reminder/{id}`
 */
export const Reminder_get = buildCall() //
  .args<rt.Static<typeof reminder_getArgsRt>>()
  .method('get')
  .path((args) => `/reminder/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: Reminder_search

const reminder_searchArgsRt = rt.Intersect(
  rt.Record({ dateFrom: rt.String, dateTo: rt.String }).asReadonly(),
  rt
    .Record({
      id: rt.String,
      termOfPaymentTo: rt.String,
      termOfPaymentFrom: rt.String,
      invoiceId: rt.Number,
      customerId: rt.Number,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: Reminder_search
 * `GET: /reminder`
 */
export const Reminder_search = buildCall() //
  .args<rt.Static<typeof reminder_searchArgsRt>>()
  .method('get')
  .path('/reminder')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'dateFrom',
          'dateTo',
          'termOfPaymentTo',
          'termOfPaymentFrom',
          'invoiceId',
          'customerId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: ResultbudgetCompany_getCompanyResultBudget

const resultbudgetCompany_getCompanyResultBudgetArgsRt = rt
  .Record({
    year: rt.Number,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: ResultbudgetCompany_getCompanyResultBudget
 * `GET: /resultbudget/company`
 */
export const ResultbudgetCompany_getCompanyResultBudget = buildCall() //
  .args<rt.Static<typeof resultbudgetCompany_getCompanyResultBudgetArgsRt>>()
  .method('get')
  .path('/resultbudget/company')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'year', 'from', 'count', 'sorting', 'fields'),
      ),
  )
  .build();

// Operation: ResultbudgetDepartment_getDepartmentResultBudget

const resultbudgetDepartment_getDepartmentResultBudgetArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt
    .Record({
      year: rt.Number,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID:
 * ResultbudgetDepartment_getDepartmentResultBudget
 * `GET: /resultbudget/department/{id}`
 */
export const ResultbudgetDepartment_getDepartmentResultBudget = buildCall() //
  .args<
    rt.Static<typeof resultbudgetDepartment_getDepartmentResultBudgetArgsRt>
  >()
  .method('get')
  .path((args) => `/resultbudget/department/${args.id}`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'year', 'from', 'count', 'sorting', 'fields'),
      ),
  )
  .build();

// Operation: ResultbudgetProject_getProjectResultBudget

const resultbudgetProject_getProjectResultBudgetArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt
    .Record({
      year: rt.Number,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: ResultbudgetProject_getProjectResultBudget
 * `GET: /resultbudget/project/{id}`
 */
export const ResultbudgetProject_getProjectResultBudget = buildCall() //
  .args<rt.Static<typeof resultbudgetProject_getProjectResultBudgetArgsRt>>()
  .method('get')
  .path((args) => `/resultbudget/project/${args.id}`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'year', 'from', 'count', 'sorting', 'fields'),
      ),
  )
  .build();

// Operation: ResultbudgetProduct_getProductResultBudget

const resultbudgetProduct_getProductResultBudgetArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt
    .Record({
      year: rt.Number,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: ResultbudgetProduct_getProductResultBudget
 * `GET: /resultbudget/product/{id}`
 */
export const ResultbudgetProduct_getProductResultBudget = buildCall() //
  .args<rt.Static<typeof resultbudgetProduct_getProductResultBudgetArgsRt>>()
  .method('get')
  .path((args) => `/resultbudget/product/${args.id}`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'year', 'from', 'count', 'sorting', 'fields'),
      ),
  )
  .build();

// Operation: ResultbudgetEmployee_getEmployeeResultBudget

const resultbudgetEmployee_getEmployeeResultBudgetArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt
    .Record({
      year: rt.Number,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: ResultbudgetEmployee_getEmployeeResultBudget
 * `GET: /resultbudget/employee/{id}`
 */
export const ResultbudgetEmployee_getEmployeeResultBudget = buildCall() //
  .args<rt.Static<typeof resultbudgetEmployee_getEmployeeResultBudgetArgsRt>>()
  .method('get')
  .path((args) => `/resultbudget/employee/${args.id}`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'year', 'from', 'count', 'sorting', 'fields'),
      ),
  )
  .build();

// Operation: SalaryType_search

const salaryType_searchArgsRt = rt
  .Record({
    id: rt.String,
    number: rt.String,
    name: rt.String,
    description: rt.String,
    showInTimesheet: rt.Boolean,
    isInactive: rt.Boolean,
    employeeIds: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: SalaryType_search
 * `GET: /salary/type`
 */
export const SalaryType_search = buildCall() //
  .args<rt.Static<typeof salaryType_searchArgsRt>>()
  .method('get')
  .path('/salary/type')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'number',
          'name',
          'description',
          'showInTimesheet',
          'isInactive',
          'employeeIds',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: SalaryType_get

const salaryType_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: SalaryType_get
 * `GET: /salary/type/{id}`
 */
export const SalaryType_get = buildCall() //
  .args<rt.Static<typeof salaryType_getArgsRt>>()
  .method('get')
  .path((args) => `/salary/type/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: SalaryCompilationPdf_downloadPdf

const salaryCompilationPdf_downloadPdfArgsRt = rt.Intersect(
  rt.Record({ employeeId: rt.Number }).asReadonly(),
  rt.Record({ year: rt.Number }).asPartial().asReadonly(),
);

/**
 * operation ID: SalaryCompilationPdf_downloadPdf
 * `GET: /salary/compilation/pdf`
 */
export const SalaryCompilationPdf_downloadPdf = buildCall() //
  .args<rt.Static<typeof salaryCompilationPdf_downloadPdfArgsRt>>()
  .method('get')
  .path('/salary/compilation/pdf')
  .query(
    (args) => new URLSearchParams(pickQueryValues(args, 'employeeId', 'year')),
  )
  .build();

// Operation: SalaryCompilation_get

const salaryCompilation_getArgsRt = rt.Intersect(
  rt.Record({ employeeId: rt.Number }).asReadonly(),
  rt.Record({ year: rt.Number, fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: SalaryCompilation_get
 * `GET: /salary/compilation`
 */
export const SalaryCompilation_get = buildCall() //
  .args<rt.Static<typeof salaryCompilation_getArgsRt>>()
  .method('get')
  .path('/salary/compilation')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'employeeId', 'year', 'fields'),
      ),
  )
  .build();

// Operation: SalaryPayslip_search

const salaryPayslip_searchArgsRt = rt
  .Record({
    id: rt.String,
    employeeId: rt.String,
    wageTransactionId: rt.String,
    activityId: rt.String,
    yearFrom: rt.Number,
    yearTo: rt.Number,
    monthFrom: rt.Number,
    monthTo: rt.Number,
    voucherDateFrom: rt.String,
    voucherDateTo: rt.String,
    comment: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: SalaryPayslip_search
 * `GET: /salary/payslip`
 */
export const SalaryPayslip_search = buildCall() //
  .args<rt.Static<typeof salaryPayslip_searchArgsRt>>()
  .method('get')
  .path('/salary/payslip')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'employeeId',
          'wageTransactionId',
          'activityId',
          'yearFrom',
          'yearTo',
          'monthFrom',
          'monthTo',
          'voucherDateFrom',
          'voucherDateTo',
          'comment',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: SalaryPayslipPdf_downloadPdf

const salaryPayslipPdf_downloadPdfArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: SalaryPayslipPdf_downloadPdf
 * `GET: /salary/payslip/{id}/pdf`
 */
export const SalaryPayslipPdf_downloadPdf = buildCall() //
  .args<rt.Static<typeof salaryPayslipPdf_downloadPdfArgsRt>>()
  .method('get')
  .path((args) => `/salary/payslip/${args.id}/pdf`)
  .build();

// Operation: SalaryPayslip_get

const salaryPayslip_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: SalaryPayslip_get
 * `GET: /salary/payslip/{id}`
 */
export const SalaryPayslip_get = buildCall() //
  .args<rt.Static<typeof salaryPayslip_getArgsRt>>()
  .method('get')
  .path((args) => `/salary/payslip/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: SalarySettings_get

const salarySettings_getArgsRt = rt
  .Record({ fields: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: SalarySettings_get
 * `GET: /salary/settings`
 */
export const SalarySettings_get = buildCall() //
  .args<rt.Static<typeof salarySettings_getArgsRt>>()
  .method('get')
  .path('/salary/settings')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: SalarySettings_put

const salarySettings_putArgsRt = rt
  .Record({ body: salarySettingsRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: SalarySettings_put
 * `PUT: /salary/settings`
 */
export const SalarySettings_put = buildCall() //
  .args<rt.Static<typeof salarySettings_putArgsRt>>()
  .method('put')
  .path('/salary/settings')
  .body((args) => args.body)
  .build();

// Operation: SalarySettingsHoliday_search

const salarySettingsHoliday_searchArgsRt = rt
  .Record({
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: SalarySettingsHoliday_search
 * `GET: /salary/settings/holiday`
 */
export const SalarySettingsHoliday_search = buildCall() //
  .args<rt.Static<typeof salarySettingsHoliday_searchArgsRt>>()
  .method('get')
  .path('/salary/settings/holiday')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'from', 'count', 'sorting', 'fields'),
      ),
  )
  .build();

// Operation: SalarySettingsHoliday_post

const salarySettingsHoliday_postArgsRt = rt
  .Record({ body: companyHolidayRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: SalarySettingsHoliday_post
 * `POST: /salary/settings/holiday`
 */
export const SalarySettingsHoliday_post = buildCall() //
  .args<rt.Static<typeof salarySettingsHoliday_postArgsRt>>()
  .method('post')
  .path('/salary/settings/holiday')
  .body((args) => args.body)
  .build();

// Operation: SalarySettingsHolidayList_putList

const salarySettingsHolidayList_putListArgsRt = rt
  .Record({ body: rt.Array(companyHolidayRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: SalarySettingsHolidayList_putList
 * `PUT: /salary/settings/holiday/list`
 */
export const SalarySettingsHolidayList_putList = buildCall() //
  .args<rt.Static<typeof salarySettingsHolidayList_putListArgsRt>>()
  .method('put')
  .path('/salary/settings/holiday/list')
  .body((args) => args.body)
  .build();

// Operation: SalarySettingsHolidayList_postList

const salarySettingsHolidayList_postListArgsRt = rt
  .Record({ body: rt.Array(companyHolidayRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: SalarySettingsHolidayList_postList
 * `POST: /salary/settings/holiday/list`
 */
export const SalarySettingsHolidayList_postList = buildCall() //
  .args<rt.Static<typeof salarySettingsHolidayList_postListArgsRt>>()
  .method('post')
  .path('/salary/settings/holiday/list')
  .body((args) => args.body)
  .build();

// Operation: SalarySettingsHolidayList_deleteByIds

const salarySettingsHolidayList_deleteByIdsArgsRt = rt
  .Record({ ids: rt.String })
  .asReadonly();

/**
 * operation ID: SalarySettingsHolidayList_deleteByIds
 * `DELETE: /salary/settings/holiday/list`
 */
export const SalarySettingsHolidayList_deleteByIds = buildCall() //
  .args<rt.Static<typeof salarySettingsHolidayList_deleteByIdsArgsRt>>()
  .method('delete')
  .path('/salary/settings/holiday/list')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'ids')))
  .build();

// Operation: SalarySettingsHoliday_put

const salarySettingsHoliday_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: companyHolidayRt }).asPartial().asReadonly(),
);

/**
 * operation ID: SalarySettingsHoliday_put
 * `PUT: /salary/settings/holiday/{id}`
 */
export const SalarySettingsHoliday_put = buildCall() //
  .args<rt.Static<typeof salarySettingsHoliday_putArgsRt>>()
  .method('put')
  .path((args) => `/salary/settings/holiday/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: SalarySettingsPensionScheme_search

const salarySettingsPensionScheme_searchArgsRt = rt
  .Record({
    number: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: SalarySettingsPensionScheme_search
 * `GET: /salary/settings/pensionScheme`
 */
export const SalarySettingsPensionScheme_search = buildCall() //
  .args<rt.Static<typeof salarySettingsPensionScheme_searchArgsRt>>()
  .method('get')
  .path('/salary/settings/pensionScheme')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'number', 'from', 'count', 'sorting', 'fields'),
      ),
  )
  .build();

// Operation: SalarySettingsPensionScheme_post

const salarySettingsPensionScheme_postArgsRt = rt
  .Record({ body: pensionSchemeRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: SalarySettingsPensionScheme_post
 * `POST: /salary/settings/pensionScheme`
 */
export const SalarySettingsPensionScheme_post = buildCall() //
  .args<rt.Static<typeof salarySettingsPensionScheme_postArgsRt>>()
  .method('post')
  .path('/salary/settings/pensionScheme')
  .body((args) => args.body)
  .build();

// Operation: SalarySettingsPensionSchemeList_putList

const salarySettingsPensionSchemeList_putListArgsRt = rt
  .Record({ body: rt.Array(pensionSchemeRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: SalarySettingsPensionSchemeList_putList
 * `PUT: /salary/settings/pensionScheme/list`
 */
export const SalarySettingsPensionSchemeList_putList = buildCall() //
  .args<rt.Static<typeof salarySettingsPensionSchemeList_putListArgsRt>>()
  .method('put')
  .path('/salary/settings/pensionScheme/list')
  .body((args) => args.body)
  .build();

// Operation: SalarySettingsPensionSchemeList_postList

const salarySettingsPensionSchemeList_postListArgsRt = rt
  .Record({ body: rt.Array(pensionSchemeRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: SalarySettingsPensionSchemeList_postList
 * `POST: /salary/settings/pensionScheme/list`
 */
export const SalarySettingsPensionSchemeList_postList = buildCall() //
  .args<rt.Static<typeof salarySettingsPensionSchemeList_postListArgsRt>>()
  .method('post')
  .path('/salary/settings/pensionScheme/list')
  .body((args) => args.body)
  .build();

// Operation: SalarySettingsPensionSchemeList_deleteByIds

const salarySettingsPensionSchemeList_deleteByIdsArgsRt = rt
  .Record({ ids: rt.String })
  .asReadonly();

/**
 * operation ID: SalarySettingsPensionSchemeList_deleteByIds
 * `DELETE: /salary/settings/pensionScheme/list`
 */
export const SalarySettingsPensionSchemeList_deleteByIds = buildCall() //
  .args<rt.Static<typeof salarySettingsPensionSchemeList_deleteByIdsArgsRt>>()
  .method('delete')
  .path('/salary/settings/pensionScheme/list')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'ids')))
  .build();

// Operation: SalarySettingsPensionScheme_get

const salarySettingsPensionScheme_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: SalarySettingsPensionScheme_get
 * `GET: /salary/settings/pensionScheme/{id}`
 */
export const SalarySettingsPensionScheme_get = buildCall() //
  .args<rt.Static<typeof salarySettingsPensionScheme_getArgsRt>>()
  .method('get')
  .path((args) => `/salary/settings/pensionScheme/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: SalarySettingsPensionScheme_put

const salarySettingsPensionScheme_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: pensionSchemeRt }).asPartial().asReadonly(),
);

/**
 * operation ID: SalarySettingsPensionScheme_put
 * `PUT: /salary/settings/pensionScheme/{id}`
 */
export const SalarySettingsPensionScheme_put = buildCall() //
  .args<rt.Static<typeof salarySettingsPensionScheme_putArgsRt>>()
  .method('put')
  .path((args) => `/salary/settings/pensionScheme/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: SalarySettingsPensionScheme_delete

const salarySettingsPensionScheme_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: SalarySettingsPensionScheme_delete
 * `DELETE: /salary/settings/pensionScheme/{id}`
 */
export const SalarySettingsPensionScheme_delete = buildCall() //
  .args<rt.Static<typeof salarySettingsPensionScheme_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/salary/settings/pensionScheme/${args.id}`)
  .build();

// Operation: SalaryTransaction_post

const salaryTransaction_postArgsRt = rt
  .Record({ body: salaryTransactionRt, generateTaxDeduction: rt.Boolean })
  .asPartial()
  .asReadonly();

/**
 * operation ID: SalaryTransaction_post
 * `POST: /salary/transaction`
 */
export const SalaryTransaction_post = buildCall() //
  .args<rt.Static<typeof salaryTransaction_postArgsRt>>()
  .method('post')
  .path('/salary/transaction')
  .query(
    (args) =>
      new URLSearchParams(pickQueryValues(args, 'generateTaxDeduction')),
  )
  .body((args) => args.body)
  .build();

// Operation: SalaryTransaction_get

const salaryTransaction_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: SalaryTransaction_get
 * `GET: /salary/transaction/{id}`
 */
export const SalaryTransaction_get = buildCall() //
  .args<rt.Static<typeof salaryTransaction_getArgsRt>>()
  .method('get')
  .path((args) => `/salary/transaction/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: SalaryTransaction_delete

const salaryTransaction_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: SalaryTransaction_delete
 * `DELETE: /salary/transaction/{id}`
 */
export const SalaryTransaction_delete = buildCall() //
  .args<rt.Static<typeof salaryTransaction_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/salary/transaction/${args.id}`)
  .build();

// Operation: Supplier_search

const supplier_searchArgsRt = rt
  .Record({
    id: rt.String,
    supplierNumber: rt.String,
    organizationNumber: rt.String,
    email: rt.String,
    invoiceEmail: rt.String,
    isInactive: rt.Boolean,
    accountManagerId: rt.String,
    changedSince: rt.String,
    isWholesaler: rt.Boolean,
    showProducts: rt.Boolean,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Supplier_search
 * `GET: /supplier`
 */
export const Supplier_search = buildCall() //
  .args<rt.Static<typeof supplier_searchArgsRt>>()
  .method('get')
  .path('/supplier')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'supplierNumber',
          'organizationNumber',
          'email',
          'invoiceEmail',
          'isInactive',
          'accountManagerId',
          'changedSince',
          'isWholesaler',
          'showProducts',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: Supplier_post

const supplier_postArgsRt = rt
  .Record({ body: supplierRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: Supplier_post
 * `POST: /supplier`
 */
export const Supplier_post = buildCall() //
  .args<rt.Static<typeof supplier_postArgsRt>>()
  .method('post')
  .path('/supplier')
  .body((args) => args.body)
  .build();

// Operation: SupplierList_putList

const supplierList_putListArgsRt = rt
  .Record({ body: rt.Array(supplierRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: SupplierList_putList
 * `PUT: /supplier/list`
 */
export const SupplierList_putList = buildCall() //
  .args<rt.Static<typeof supplierList_putListArgsRt>>()
  .method('put')
  .path('/supplier/list')
  .body((args) => args.body)
  .build();

// Operation: SupplierList_postList

const supplierList_postListArgsRt = rt
  .Record({ body: rt.Array(supplierRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: SupplierList_postList
 * `POST: /supplier/list`
 */
export const SupplierList_postList = buildCall() //
  .args<rt.Static<typeof supplierList_postListArgsRt>>()
  .method('post')
  .path('/supplier/list')
  .body((args) => args.body)
  .build();

// Operation: Supplier_get

const supplier_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: Supplier_get
 * `GET: /supplier/{id}`
 */
export const Supplier_get = buildCall() //
  .args<rt.Static<typeof supplier_getArgsRt>>()
  .method('get')
  .path((args) => `/supplier/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: Supplier_put

const supplier_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: supplierRt }).asPartial().asReadonly(),
);

/**
 * operation ID: Supplier_put
 * `PUT: /supplier/{id}`
 */
export const Supplier_put = buildCall() //
  .args<rt.Static<typeof supplier_putArgsRt>>()
  .method('put')
  .path((args) => `/supplier/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: Supplier_delete

const supplier_deleteArgsRt = rt.Record({ id: rt.Number }).asReadonly();

/**
 * operation ID: Supplier_delete
 * `DELETE: /supplier/{id}`
 */
export const Supplier_delete = buildCall() //
  .args<rt.Static<typeof supplier_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/supplier/${args.id}`)
  .build();

// Operation: SupplierInvoice_search

const supplierInvoice_searchArgsRt = rt.Intersect(
  rt
    .Record({ invoiceDateFrom: rt.String, invoiceDateTo: rt.String })
    .asReadonly(),
  rt
    .Record({
      id: rt.String,
      invoiceNumber: rt.String,
      kid: rt.String,
      voucherId: rt.String,
      supplierId: rt.String,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: SupplierInvoice_search
 * `GET: /supplierInvoice`
 */
export const SupplierInvoice_search = buildCall() //
  .args<rt.Static<typeof supplierInvoice_searchArgsRt>>()
  .method('get')
  .path('/supplierInvoice')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'invoiceDateFrom',
          'invoiceDateTo',
          'invoiceNumber',
          'kid',
          'voucherId',
          'supplierId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: SupplierInvoiceApprove_approve

const supplierInvoiceApprove_approveArgsRt = rt.Intersect(
  rt.Record({ invoiceId: rt.Number }).asReadonly(),
  rt.Record({ comment: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: SupplierInvoiceApprove_approve
 * `PUT: /supplierInvoice/{invoiceId}/:approve`
 */
export const SupplierInvoiceApprove_approve = buildCall() //
  .args<rt.Static<typeof supplierInvoiceApprove_approveArgsRt>>()
  .method('put')
  .path((args) => `/supplierInvoice/${args.invoiceId}/:approve`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'comment')))
  .build();

// Operation: SupplierInvoicePdf_downloadPdf

const supplierInvoicePdf_downloadPdfArgsRt = rt
  .Record({ invoiceId: rt.Number })
  .asReadonly();

/**
 * operation ID: SupplierInvoicePdf_downloadPdf
 * `GET: /supplierInvoice/{invoiceId}/pdf`
 */
export const SupplierInvoicePdf_downloadPdf = buildCall() //
  .args<rt.Static<typeof supplierInvoicePdf_downloadPdfArgsRt>>()
  .method('get')
  .path((args) => `/supplierInvoice/${args.invoiceId}/pdf`)
  .build();

// Operation: SupplierInvoiceForApproval_getApprovalInvoices

const supplierInvoiceForApproval_getApprovalInvoicesArgsRt = rt
  .Record({
    searchText: rt.String,
    showAll: rt.Boolean,
    employeeId: rt.Number,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: SupplierInvoiceForApproval_getApprovalInvoices
 * `GET: /supplierInvoice/forApproval`
 */
export const SupplierInvoiceForApproval_getApprovalInvoices = buildCall() //
  .args<
    rt.Static<typeof supplierInvoiceForApproval_getApprovalInvoicesArgsRt>
  >()
  .method('get')
  .path('/supplierInvoice/forApproval')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'searchText',
          'showAll',
          'employeeId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: SupplierInvoiceVoucherPostings_putPostings

const supplierInvoiceVoucherPostings_putPostingsArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt
    .Record({ body: rt.Array(orderLinePostingDTORt), sendToLedger: rt.Boolean })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: SupplierInvoiceVoucherPostings_putPostings
 * `PUT: /supplierInvoice/voucher/{id}/postings`
 */
export const SupplierInvoiceVoucherPostings_putPostings = buildCall() //
  .args<rt.Static<typeof supplierInvoiceVoucherPostings_putPostingsArgsRt>>()
  .method('put')
  .path((args) => `/supplierInvoice/voucher/${args.id}/postings`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'sendToLedger')))
  .body((args) => args.body)
  .build();

// Operation: SupplierInvoiceApprove_approveMany

const supplierInvoiceApprove_approveManyArgsRt = rt
  .Record({ invoiceIds: rt.String, comment: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: SupplierInvoiceApprove_approveMany
 * `PUT: /supplierInvoice/:approve`
 */
export const SupplierInvoiceApprove_approveMany = buildCall() //
  .args<rt.Static<typeof supplierInvoiceApprove_approveManyArgsRt>>()
  .method('put')
  .path('/supplierInvoice/:approve')
  .query(
    (args) =>
      new URLSearchParams(pickQueryValues(args, 'invoiceIds', 'comment')),
  )
  .build();

// Operation: SupplierInvoiceAddRecipient_addRecipientToMany

const supplierInvoiceAddRecipient_addRecipientToManyArgsRt = rt.Intersect(
  rt.Record({ employeeId: rt.Number }).asReadonly(),
  rt
    .Record({ invoiceIds: rt.String, comment: rt.String })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: SupplierInvoiceAddRecipient_addRecipientToMany
 * `PUT: /supplierInvoice/:addRecipient`
 */
export const SupplierInvoiceAddRecipient_addRecipientToMany = buildCall() //
  .args<
    rt.Static<typeof supplierInvoiceAddRecipient_addRecipientToManyArgsRt>
  >()
  .method('put')
  .path('/supplierInvoice/:addRecipient')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'employeeId', 'invoiceIds', 'comment'),
      ),
  )
  .build();

// Operation: SupplierInvoiceAddRecipient_addRecipient

const supplierInvoiceAddRecipient_addRecipientArgsRt = rt.Intersect(
  rt.Record({ invoiceId: rt.Number, employeeId: rt.Number }).asReadonly(),
  rt.Record({ comment: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: SupplierInvoiceAddRecipient_addRecipient
 * `PUT: /supplierInvoice/{invoiceId}/:addRecipient`
 */
export const SupplierInvoiceAddRecipient_addRecipient = buildCall() //
  .args<rt.Static<typeof supplierInvoiceAddRecipient_addRecipientArgsRt>>()
  .method('put')
  .path((args) => `/supplierInvoice/${args.invoiceId}/:addRecipient`)
  .query(
    (args) =>
      new URLSearchParams(pickQueryValues(args, 'employeeId', 'comment')),
  )
  .build();

// Operation: SupplierInvoiceReject_rejectMany

const supplierInvoiceReject_rejectManyArgsRt = rt.Intersect(
  rt.Record({ comment: rt.String }).asReadonly(),
  rt.Record({ invoiceIds: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: SupplierInvoiceReject_rejectMany
 * `PUT: /supplierInvoice/:reject`
 */
export const SupplierInvoiceReject_rejectMany = buildCall() //
  .args<rt.Static<typeof supplierInvoiceReject_rejectManyArgsRt>>()
  .method('put')
  .path('/supplierInvoice/:reject')
  .query(
    (args) =>
      new URLSearchParams(pickQueryValues(args, 'comment', 'invoiceIds')),
  )
  .build();

// Operation: SupplierInvoiceAddPayment_addPayment

const supplierInvoiceAddPayment_addPaymentArgsRt = rt.Intersect(
  rt.Record({ invoiceId: rt.Number, paymentType: rt.Number }).asReadonly(),
  rt
    .Record({
      amount: rt.String,
      kidOrReceiverReference: rt.String,
      bban: rt.String,
      paymentDate: rt.String,
      useDefaultPaymentType: rt.Boolean,
      partialPayment: rt.Boolean,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: SupplierInvoiceAddPayment_addPayment
 * `POST: /supplierInvoice/{invoiceId}/:addPayment`
 */
export const SupplierInvoiceAddPayment_addPayment = buildCall() //
  .args<rt.Static<typeof supplierInvoiceAddPayment_addPaymentArgsRt>>()
  .method('post')
  .path((args) => `/supplierInvoice/${args.invoiceId}/:addPayment`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'paymentType',
          'amount',
          'kidOrReceiverReference',
          'bban',
          'paymentDate',
          'useDefaultPaymentType',
          'partialPayment',
        ),
      ),
  )
  .build();

// Operation: SupplierInvoiceReject_reject

const supplierInvoiceReject_rejectArgsRt = rt
  .Record({ invoiceId: rt.Number, comment: rt.String })
  .asReadonly();

/**
 * operation ID: SupplierInvoiceReject_reject
 * `PUT: /supplierInvoice/{invoiceId}/:reject`
 */
export const SupplierInvoiceReject_reject = buildCall() //
  .args<rt.Static<typeof supplierInvoiceReject_rejectArgsRt>>()
  .method('put')
  .path((args) => `/supplierInvoice/${args.invoiceId}/:reject`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'comment')))
  .build();

// Operation: SupplierInvoice_get

const supplierInvoice_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: SupplierInvoice_get
 * `GET: /supplierInvoice/{id}`
 */
export const SupplierInvoice_get = buildCall() //
  .args<rt.Static<typeof supplierInvoice_getArgsRt>>()
  .method('get')
  .path((args) => `/supplierInvoice/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: VoucherApprovalListElement_get

const voucherApprovalListElement_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: VoucherApprovalListElement_get
 * `GET: /voucherApprovalListElement/{id}`
 */
export const VoucherApprovalListElement_get = buildCall() //
  .args<rt.Static<typeof voucherApprovalListElement_getArgsRt>>()
  .method('get')
  .path((args) => `/voucherApprovalListElement/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TimesheetEntry_search

const timesheetEntry_searchArgsRt = rt.Intersect(
  rt.Record({ dateFrom: rt.String, dateTo: rt.String }).asReadonly(),
  rt
    .Record({
      id: rt.String,
      employeeId: rt.String,
      projectId: rt.String,
      activityId: rt.String,
      comment: rt.String,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: TimesheetEntry_search
 * `GET: /timesheet/entry`
 */
export const TimesheetEntry_search = buildCall() //
  .args<rt.Static<typeof timesheetEntry_searchArgsRt>>()
  .method('get')
  .path('/timesheet/entry')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'employeeId',
          'projectId',
          'activityId',
          'dateFrom',
          'dateTo',
          'comment',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: TimesheetEntry_post

const timesheetEntry_postArgsRt = rt
  .Record({ body: timesheetEntryRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TimesheetEntry_post
 * `POST: /timesheet/entry`
 */
export const TimesheetEntry_post = buildCall() //
  .args<rt.Static<typeof timesheetEntry_postArgsRt>>()
  .method('post')
  .path('/timesheet/entry')
  .body((args) => args.body)
  .build();

// Operation: TimesheetEntryList_putList

const timesheetEntryList_putListArgsRt = rt
  .Record({ body: rt.Array(timesheetEntryRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TimesheetEntryList_putList
 * `PUT: /timesheet/entry/list`
 */
export const TimesheetEntryList_putList = buildCall() //
  .args<rt.Static<typeof timesheetEntryList_putListArgsRt>>()
  .method('put')
  .path('/timesheet/entry/list')
  .body((args) => args.body)
  .build();

// Operation: TimesheetEntryList_postList

const timesheetEntryList_postListArgsRt = rt
  .Record({ body: rt.Array(timesheetEntryRt) })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TimesheetEntryList_postList
 * `POST: /timesheet/entry/list`
 */
export const TimesheetEntryList_postList = buildCall() //
  .args<rt.Static<typeof timesheetEntryList_postListArgsRt>>()
  .method('post')
  .path('/timesheet/entry/list')
  .body((args) => args.body)
  .build();

// Operation: TimesheetEntryRecentProjects_getRecentProjects

const timesheetEntryRecentProjects_getRecentProjectsArgsRt = rt
  .Record({
    employeeId: rt.Number,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TimesheetEntryRecentProjects_getRecentProjects
 * `GET: /timesheet/entry/>recentProjects`
 */
export const TimesheetEntryRecentProjects_getRecentProjects = buildCall() //
  .args<
    rt.Static<typeof timesheetEntryRecentProjects_getRecentProjectsArgsRt>
  >()
  .method('get')
  .path('/timesheet/entry/>recentProjects')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'employeeId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: TimesheetEntryRecentActivities_getRecentActivities

const timesheetEntryRecentActivities_getRecentActivitiesArgsRt = rt.Intersect(
  rt.Record({ projectId: rt.Number }).asReadonly(),
  rt
    .Record({
      employeeId: rt.Number,
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID:
 * TimesheetEntryRecentActivities_getRecentActivities
 * `GET: /timesheet/entry/>recentActivities`
 */
export const TimesheetEntryRecentActivities_getRecentActivities = buildCall() //
  .args<
    rt.Static<typeof timesheetEntryRecentActivities_getRecentActivitiesArgsRt>
  >()
  .method('get')
  .path('/timesheet/entry/>recentActivities')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'employeeId',
          'projectId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: TimesheetEntryTotalHours_getTotalHours

const timesheetEntryTotalHours_getTotalHoursArgsRt = rt
  .Record({
    employeeId: rt.Number,
    startDate: rt.String,
    endDate: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TimesheetEntryTotalHours_getTotalHours
 * `GET: /timesheet/entry/>totalHours`
 */
export const TimesheetEntryTotalHours_getTotalHours = buildCall() //
  .args<rt.Static<typeof timesheetEntryTotalHours_getTotalHoursArgsRt>>()
  .method('get')
  .path('/timesheet/entry/>totalHours')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'employeeId', 'startDate', 'endDate', 'fields'),
      ),
  )
  .build();

// Operation: TimesheetEntry_get

const timesheetEntry_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: TimesheetEntry_get
 * `GET: /timesheet/entry/{id}`
 */
export const TimesheetEntry_get = buildCall() //
  .args<rt.Static<typeof timesheetEntry_getArgsRt>>()
  .method('get')
  .path((args) => `/timesheet/entry/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TimesheetEntry_put

const timesheetEntry_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: timesheetEntryRt }).asPartial().asReadonly(),
);

/**
 * operation ID: TimesheetEntry_put
 * `PUT: /timesheet/entry/{id}`
 */
export const TimesheetEntry_put = buildCall() //
  .args<rt.Static<typeof timesheetEntry_putArgsRt>>()
  .method('put')
  .path((args) => `/timesheet/entry/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: TimesheetEntry_delete

const timesheetEntry_deleteArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ version: rt.Number }).asPartial().asReadonly(),
);

/**
 * operation ID: TimesheetEntry_delete
 * `DELETE: /timesheet/entry/{id}`
 */
export const TimesheetEntry_delete = buildCall() //
  .args<rt.Static<typeof timesheetEntry_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/timesheet/entry/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'version')))
  .build();

// Operation: TimesheetMonthApprove_approve

const timesheetMonthApprove_approveArgsRt = rt
  .Record({
    id: rt.Number,
    employeeIds: rt.String,
    monthYear: rt.String,
    approvedUntilDate: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TimesheetMonthApprove_approve
 * `PUT: /timesheet/month/:approve`
 */
export const TimesheetMonthApprove_approve = buildCall() //
  .args<rt.Static<typeof timesheetMonthApprove_approveArgsRt>>()
  .method('put')
  .path('/timesheet/month/:approve')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'employeeIds',
          'monthYear',
          'approvedUntilDate',
        ),
      ),
  )
  .build();

// Operation: TimesheetMonthUnapprove_unapprove

const timesheetMonthUnapprove_unapproveArgsRt = rt
  .Record({ id: rt.Number, employeeIds: rt.String, monthYear: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TimesheetMonthUnapprove_unapprove
 * `PUT: /timesheet/month/:unapprove`
 */
export const TimesheetMonthUnapprove_unapprove = buildCall() //
  .args<rt.Static<typeof timesheetMonthUnapprove_unapproveArgsRt>>()
  .method('put')
  .path('/timesheet/month/:unapprove')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'id', 'employeeIds', 'monthYear'),
      ),
  )
  .build();

// Operation: TimesheetMonthReopen_reopen

const timesheetMonthReopen_reopenArgsRt = rt
  .Record({ id: rt.Number, employeeIds: rt.String, monthYear: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TimesheetMonthReopen_reopen
 * `PUT: /timesheet/month/:reopen`
 */
export const TimesheetMonthReopen_reopen = buildCall() //
  .args<rt.Static<typeof timesheetMonthReopen_reopenArgsRt>>()
  .method('put')
  .path('/timesheet/month/:reopen')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'id', 'employeeIds', 'monthYear'),
      ),
  )
  .build();

// Operation: TimesheetMonthByMonthNumber_getByMonthNumber

const timesheetMonthByMonthNumber_getByMonthNumberArgsRt = rt.Intersect(
  rt.Record({ employeeIds: rt.String, monthYear: rt.String }).asReadonly(),
  rt
    .Record({
      from: rt.Number,
      count: rt.Number,
      sorting: rt.String,
      fields: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: TimesheetMonthByMonthNumber_getByMonthNumber
 * `GET: /timesheet/month/byMonthNumber`
 */
export const TimesheetMonthByMonthNumber_getByMonthNumber = buildCall() //
  .args<rt.Static<typeof timesheetMonthByMonthNumber_getByMonthNumberArgsRt>>()
  .method('get')
  .path('/timesheet/month/byMonthNumber')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'employeeIds',
          'monthYear',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: TimesheetMonthComplete_complete

const timesheetMonthComplete_completeArgsRt = rt
  .Record({ id: rt.Number, employeeIds: rt.String, monthYear: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TimesheetMonthComplete_complete
 * `PUT: /timesheet/month/:complete`
 */
export const TimesheetMonthComplete_complete = buildCall() //
  .args<rt.Static<typeof timesheetMonthComplete_completeArgsRt>>()
  .method('put')
  .path('/timesheet/month/:complete')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'id', 'employeeIds', 'monthYear'),
      ),
  )
  .build();

// Operation: TimesheetMonth_get

const timesheetMonth_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: TimesheetMonth_get
 * `GET: /timesheet/month/{id}`
 */
export const TimesheetMonth_get = buildCall() //
  .args<rt.Static<typeof timesheetMonth_getArgsRt>>()
  .method('get')
  .path((args) => `/timesheet/month/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TimesheetSalaryTypeSpecification_search

const timesheetSalaryTypeSpecification_searchArgsRt = rt
  .Record({
    dateFrom: rt.String,
    dateTo: rt.String,
    employeeId: rt.Number,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TimesheetSalaryTypeSpecification_search
 * `GET: /timesheet/salaryTypeSpecification`
 */
export const TimesheetSalaryTypeSpecification_search = buildCall() //
  .args<rt.Static<typeof timesheetSalaryTypeSpecification_searchArgsRt>>()
  .method('get')
  .path('/timesheet/salaryTypeSpecification')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'dateFrom',
          'dateTo',
          'employeeId',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: TimesheetSalaryTypeSpecification_post

const timesheetSalaryTypeSpecification_postArgsRt = rt
  .Record({ body: timesheetSalaryTypeSpecificationRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TimesheetSalaryTypeSpecification_post
 * `POST: /timesheet/salaryTypeSpecification`
 */
export const TimesheetSalaryTypeSpecification_post = buildCall() //
  .args<rt.Static<typeof timesheetSalaryTypeSpecification_postArgsRt>>()
  .method('post')
  .path('/timesheet/salaryTypeSpecification')
  .body((args) => args.body)
  .build();

// Operation: TimesheetSalaryTypeSpecification_get

const timesheetSalaryTypeSpecification_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: TimesheetSalaryTypeSpecification_get
 * `GET: /timesheet/salaryTypeSpecification/{id}`
 */
export const TimesheetSalaryTypeSpecification_get = buildCall() //
  .args<rt.Static<typeof timesheetSalaryTypeSpecification_getArgsRt>>()
  .method('get')
  .path((args) => `/timesheet/salaryTypeSpecification/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TimesheetSalaryTypeSpecification_put

const timesheetSalaryTypeSpecification_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt
    .Record({ body: timesheetSalaryTypeSpecificationRt })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: TimesheetSalaryTypeSpecification_put
 * `PUT: /timesheet/salaryTypeSpecification/{id}`
 */
export const TimesheetSalaryTypeSpecification_put = buildCall() //
  .args<rt.Static<typeof timesheetSalaryTypeSpecification_putArgsRt>>()
  .method('put')
  .path((args) => `/timesheet/salaryTypeSpecification/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: TimesheetSalaryTypeSpecification_delete

const timesheetSalaryTypeSpecification_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: TimesheetSalaryTypeSpecification_delete
 * `DELETE: /timesheet/salaryTypeSpecification/{id}`
 */
export const TimesheetSalaryTypeSpecification_delete = buildCall() //
  .args<rt.Static<typeof timesheetSalaryTypeSpecification_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/timesheet/salaryTypeSpecification/${args.id}`)
  .build();

// Operation: TimesheetSettings_get

const timesheetSettings_getArgsRt = rt
  .Record({ fields: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TimesheetSettings_get
 * `GET: /timesheet/settings`
 */
export const TimesheetSettings_get = buildCall() //
  .args<rt.Static<typeof timesheetSettings_getArgsRt>>()
  .method('get')
  .path('/timesheet/settings')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TimesheetTimeClock_search

const timesheetTimeClock_searchArgsRt = rt
  .Record({
    id: rt.String,
    employeeId: rt.String,
    projectId: rt.String,
    activityId: rt.String,
    dateFrom: rt.String,
    dateTo: rt.String,
    hourId: rt.String,
    isRunning: rt.Boolean,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TimesheetTimeClock_search
 * `GET: /timesheet/timeClock`
 */
export const TimesheetTimeClock_search = buildCall() //
  .args<rt.Static<typeof timesheetTimeClock_searchArgsRt>>()
  .method('get')
  .path('/timesheet/timeClock')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'employeeId',
          'projectId',
          'activityId',
          'dateFrom',
          'dateTo',
          'hourId',
          'isRunning',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: TimesheetTimeClockPresent_getPresent

const timesheetTimeClockPresent_getPresentArgsRt = rt
  .Record({ employeeId: rt.Number, fields: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TimesheetTimeClockPresent_getPresent
 * `GET: /timesheet/timeClock/present`
 */
export const TimesheetTimeClockPresent_getPresent = buildCall() //
  .args<rt.Static<typeof timesheetTimeClockPresent_getPresentArgsRt>>()
  .method('get')
  .path('/timesheet/timeClock/present')
  .query(
    (args) =>
      new URLSearchParams(pickQueryValues(args, 'employeeId', 'fields')),
  )
  .build();

// Operation: TimesheetTimeClock_get

const timesheetTimeClock_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: TimesheetTimeClock_get
 * `GET: /timesheet/timeClock/{id}`
 */
export const TimesheetTimeClock_get = buildCall() //
  .args<rt.Static<typeof timesheetTimeClock_getArgsRt>>()
  .method('get')
  .path((args) => `/timesheet/timeClock/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TimesheetTimeClock_put

const timesheetTimeClock_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: timeClockRt }).asPartial().asReadonly(),
);

/**
 * operation ID: TimesheetTimeClock_put
 * `PUT: /timesheet/timeClock/{id}`
 */
export const TimesheetTimeClock_put = buildCall() //
  .args<rt.Static<typeof timesheetTimeClock_putArgsRt>>()
  .method('put')
  .path((args) => `/timesheet/timeClock/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: TimesheetTimeClockStart_start

const timesheetTimeClockStart_startArgsRt = rt.Intersect(
  rt.Record({ activityId: rt.Number }).asReadonly(),
  rt
    .Record({ employeeId: rt.Number, projectId: rt.Number, date: rt.String })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: TimesheetTimeClockStart_start
 * `PUT: /timesheet/timeClock/:start`
 */
export const TimesheetTimeClockStart_start = buildCall() //
  .args<rt.Static<typeof timesheetTimeClockStart_startArgsRt>>()
  .method('put')
  .path('/timesheet/timeClock/:start')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'employeeId', 'projectId', 'activityId', 'date'),
      ),
  )
  .build();

// Operation: TimesheetTimeClockStop_stop

const timesheetTimeClockStop_stopArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ version: rt.Number }).asPartial().asReadonly(),
);

/**
 * operation ID: TimesheetTimeClockStop_stop
 * `PUT: /timesheet/timeClock/{id}/:stop`
 */
export const TimesheetTimeClockStop_stop = buildCall() //
  .args<rt.Static<typeof timesheetTimeClockStop_stopArgsRt>>()
  .method('put')
  .path((args) => `/timesheet/timeClock/${args.id}/:stop`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'version')))
  .build();

// Operation: TimesheetWeekApprove_approve

const timesheetWeekApprove_approveArgsRt = rt
  .Record({ id: rt.Number, employeeId: rt.Number, weekYear: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TimesheetWeekApprove_approve
 * `PUT: /timesheet/week/:approve`
 */
export const TimesheetWeekApprove_approve = buildCall() //
  .args<rt.Static<typeof timesheetWeekApprove_approveArgsRt>>()
  .method('put')
  .path('/timesheet/week/:approve')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'id', 'employeeId', 'weekYear'),
      ),
  )
  .build();

// Operation: TimesheetWeekUnapprove_unapprove

const timesheetWeekUnapprove_unapproveArgsRt = rt
  .Record({ id: rt.Number, employeeId: rt.Number, weekYear: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TimesheetWeekUnapprove_unapprove
 * `PUT: /timesheet/week/:unapprove`
 */
export const TimesheetWeekUnapprove_unapprove = buildCall() //
  .args<rt.Static<typeof timesheetWeekUnapprove_unapproveArgsRt>>()
  .method('put')
  .path('/timesheet/week/:unapprove')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'id', 'employeeId', 'weekYear'),
      ),
  )
  .build();

// Operation: TimesheetWeekReopen_reopen

const timesheetWeekReopen_reopenArgsRt = rt
  .Record({ id: rt.Number, employeeId: rt.Number, weekYear: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TimesheetWeekReopen_reopen
 * `PUT: /timesheet/week/:reopen`
 */
export const TimesheetWeekReopen_reopen = buildCall() //
  .args<rt.Static<typeof timesheetWeekReopen_reopenArgsRt>>()
  .method('put')
  .path('/timesheet/week/:reopen')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'id', 'employeeId', 'weekYear'),
      ),
  )
  .build();

// Operation: TimesheetWeekComplete_complete

const timesheetWeekComplete_completeArgsRt = rt
  .Record({ id: rt.Number, employeeId: rt.Number, weekYear: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TimesheetWeekComplete_complete
 * `PUT: /timesheet/week/:complete`
 */
export const TimesheetWeekComplete_complete = buildCall() //
  .args<rt.Static<typeof timesheetWeekComplete_completeArgsRt>>()
  .method('put')
  .path('/timesheet/week/:complete')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'id', 'employeeId', 'weekYear'),
      ),
  )
  .build();

// Operation: TimesheetWeek_search

const timesheetWeek_searchArgsRt = rt
  .Record({
    ids: rt.String,
    employeeIds: rt.String,
    weekYear: rt.String,
    approvedBy: rt.Number,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TimesheetWeek_search
 * `GET: /timesheet/week`
 */
export const TimesheetWeek_search = buildCall() //
  .args<rt.Static<typeof timesheetWeek_searchArgsRt>>()
  .method('get')
  .path('/timesheet/week')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'ids',
          'employeeIds',
          'weekYear',
          'approvedBy',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: TravelExpenseAccommodationAllowance_search

const travelExpenseAccommodationAllowance_searchArgsRt = rt
  .Record({
    travelExpenseId: rt.String,
    rateTypeId: rt.String,
    rateCategoryId: rt.String,
    rateFrom: rt.String,
    rateTo: rt.String,
    countFrom: rt.Number,
    countTo: rt.Number,
    amountFrom: rt.String,
    amountTo: rt.String,
    location: rt.String,
    address: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpenseAccommodationAllowance_search
 * `GET: /travelExpense/accommodationAllowance`
 */
export const TravelExpenseAccommodationAllowance_search = buildCall() //
  .args<rt.Static<typeof travelExpenseAccommodationAllowance_searchArgsRt>>()
  .method('get')
  .path('/travelExpense/accommodationAllowance')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'travelExpenseId',
          'rateTypeId',
          'rateCategoryId',
          'rateFrom',
          'rateTo',
          'countFrom',
          'countTo',
          'amountFrom',
          'amountTo',
          'location',
          'address',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: TravelExpenseAccommodationAllowance_post

const travelExpenseAccommodationAllowance_postArgsRt = rt
  .Record({ body: accommodationAllowanceRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpenseAccommodationAllowance_post
 * `POST: /travelExpense/accommodationAllowance`
 */
export const TravelExpenseAccommodationAllowance_post = buildCall() //
  .args<rt.Static<typeof travelExpenseAccommodationAllowance_postArgsRt>>()
  .method('post')
  .path('/travelExpense/accommodationAllowance')
  .body((args) => args.body)
  .build();

// Operation: TravelExpenseAccommodationAllowance_get

const travelExpenseAccommodationAllowance_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpenseAccommodationAllowance_get
 * `GET: /travelExpense/accommodationAllowance/{id}`
 */
export const TravelExpenseAccommodationAllowance_get = buildCall() //
  .args<rt.Static<typeof travelExpenseAccommodationAllowance_getArgsRt>>()
  .method('get')
  .path((args) => `/travelExpense/accommodationAllowance/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TravelExpenseAccommodationAllowance_put

const travelExpenseAccommodationAllowance_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: accommodationAllowanceRt }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpenseAccommodationAllowance_put
 * `PUT: /travelExpense/accommodationAllowance/{id}`
 */
export const TravelExpenseAccommodationAllowance_put = buildCall() //
  .args<rt.Static<typeof travelExpenseAccommodationAllowance_putArgsRt>>()
  .method('put')
  .path((args) => `/travelExpense/accommodationAllowance/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: TravelExpenseAccommodationAllowance_delete

const travelExpenseAccommodationAllowance_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: TravelExpenseAccommodationAllowance_delete
 * `DELETE: /travelExpense/accommodationAllowance/{id}`
 */
export const TravelExpenseAccommodationAllowance_delete = buildCall() //
  .args<rt.Static<typeof travelExpenseAccommodationAllowance_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/travelExpense/accommodationAllowance/${args.id}`)
  .build();

// Operation: TravelExpenseCost_search

const travelExpenseCost_searchArgsRt = rt
  .Record({
    travelExpenseId: rt.String,
    vatTypeId: rt.String,
    currencyId: rt.String,
    rateFrom: rt.String,
    rateTo: rt.String,
    countFrom: rt.Number,
    countTo: rt.Number,
    amountFrom: rt.String,
    amountTo: rt.String,
    location: rt.String,
    address: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpenseCost_search
 * `GET: /travelExpense/cost`
 */
export const TravelExpenseCost_search = buildCall() //
  .args<rt.Static<typeof travelExpenseCost_searchArgsRt>>()
  .method('get')
  .path('/travelExpense/cost')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'travelExpenseId',
          'vatTypeId',
          'currencyId',
          'rateFrom',
          'rateTo',
          'countFrom',
          'countTo',
          'amountFrom',
          'amountTo',
          'location',
          'address',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: TravelExpenseCost_post

const travelExpenseCost_postArgsRt = rt
  .Record({ body: costRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpenseCost_post
 * `POST: /travelExpense/cost`
 */
export const TravelExpenseCost_post = buildCall() //
  .args<rt.Static<typeof travelExpenseCost_postArgsRt>>()
  .method('post')
  .path('/travelExpense/cost')
  .body((args) => args.body)
  .build();

// Operation: TravelExpenseCost_get

const travelExpenseCost_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpenseCost_get
 * `GET: /travelExpense/cost/{id}`
 */
export const TravelExpenseCost_get = buildCall() //
  .args<rt.Static<typeof travelExpenseCost_getArgsRt>>()
  .method('get')
  .path((args) => `/travelExpense/cost/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TravelExpenseCost_put

const travelExpenseCost_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: costRt }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpenseCost_put
 * `PUT: /travelExpense/cost/{id}`
 */
export const TravelExpenseCost_put = buildCall() //
  .args<rt.Static<typeof travelExpenseCost_putArgsRt>>()
  .method('put')
  .path((args) => `/travelExpense/cost/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: TravelExpenseCost_delete

const travelExpenseCost_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: TravelExpenseCost_delete
 * `DELETE: /travelExpense/cost/{id}`
 */
export const TravelExpenseCost_delete = buildCall() //
  .args<rt.Static<typeof travelExpenseCost_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/travelExpense/cost/${args.id}`)
  .build();

// Operation: TravelExpenseMileageAllowance_search

const travelExpenseMileageAllowance_searchArgsRt = rt
  .Record({
    travelExpenseId: rt.String,
    rateTypeId: rt.String,
    rateCategoryId: rt.String,
    kmFrom: rt.String,
    kmTo: rt.String,
    rateFrom: rt.String,
    rateTo: rt.String,
    amountFrom: rt.String,
    amountTo: rt.String,
    departureLocation: rt.String,
    destination: rt.String,
    dateFrom: rt.String,
    dateTo: rt.String,
    isCompanyCar: rt.Boolean,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpenseMileageAllowance_search
 * `GET: /travelExpense/mileageAllowance`
 */
export const TravelExpenseMileageAllowance_search = buildCall() //
  .args<rt.Static<typeof travelExpenseMileageAllowance_searchArgsRt>>()
  .method('get')
  .path('/travelExpense/mileageAllowance')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'travelExpenseId',
          'rateTypeId',
          'rateCategoryId',
          'kmFrom',
          'kmTo',
          'rateFrom',
          'rateTo',
          'amountFrom',
          'amountTo',
          'departureLocation',
          'destination',
          'dateFrom',
          'dateTo',
          'isCompanyCar',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: TravelExpenseMileageAllowance_post

const travelExpenseMileageAllowance_postArgsRt = rt
  .Record({ body: mileageAllowanceRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpenseMileageAllowance_post
 * `POST: /travelExpense/mileageAllowance`
 */
export const TravelExpenseMileageAllowance_post = buildCall() //
  .args<rt.Static<typeof travelExpenseMileageAllowance_postArgsRt>>()
  .method('post')
  .path('/travelExpense/mileageAllowance')
  .body((args) => args.body)
  .build();

// Operation: TravelExpenseMileageAllowance_get

const travelExpenseMileageAllowance_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpenseMileageAllowance_get
 * `GET: /travelExpense/mileageAllowance/{id}`
 */
export const TravelExpenseMileageAllowance_get = buildCall() //
  .args<rt.Static<typeof travelExpenseMileageAllowance_getArgsRt>>()
  .method('get')
  .path((args) => `/travelExpense/mileageAllowance/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TravelExpenseMileageAllowance_put

const travelExpenseMileageAllowance_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: mileageAllowanceRt }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpenseMileageAllowance_put
 * `PUT: /travelExpense/mileageAllowance/{id}`
 */
export const TravelExpenseMileageAllowance_put = buildCall() //
  .args<rt.Static<typeof travelExpenseMileageAllowance_putArgsRt>>()
  .method('put')
  .path((args) => `/travelExpense/mileageAllowance/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: TravelExpenseMileageAllowance_delete

const travelExpenseMileageAllowance_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: TravelExpenseMileageAllowance_delete
 * `DELETE: /travelExpense/mileageAllowance/{id}`
 */
export const TravelExpenseMileageAllowance_delete = buildCall() //
  .args<rt.Static<typeof travelExpenseMileageAllowance_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/travelExpense/mileageAllowance/${args.id}`)
  .build();

// Operation: TravelExpensePassenger_search

const travelExpensePassenger_searchArgsRt = rt
  .Record({
    mileageAllowance: rt.String,
    name: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpensePassenger_search
 * `GET: /travelExpense/passenger`
 */
export const TravelExpensePassenger_search = buildCall() //
  .args<rt.Static<typeof travelExpensePassenger_searchArgsRt>>()
  .method('get')
  .path('/travelExpense/passenger')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'mileageAllowance',
          'name',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: TravelExpensePassenger_post

const travelExpensePassenger_postArgsRt = rt
  .Record({ body: passengerRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpensePassenger_post
 * `POST: /travelExpense/passenger`
 */
export const TravelExpensePassenger_post = buildCall() //
  .args<rt.Static<typeof travelExpensePassenger_postArgsRt>>()
  .method('post')
  .path('/travelExpense/passenger')
  .body((args) => args.body)
  .build();

// Operation: TravelExpensePassenger_get

const travelExpensePassenger_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpensePassenger_get
 * `GET: /travelExpense/passenger/{id}`
 */
export const TravelExpensePassenger_get = buildCall() //
  .args<rt.Static<typeof travelExpensePassenger_getArgsRt>>()
  .method('get')
  .path((args) => `/travelExpense/passenger/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TravelExpensePassenger_put

const travelExpensePassenger_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: passengerRt }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpensePassenger_put
 * `PUT: /travelExpense/passenger/{id}`
 */
export const TravelExpensePassenger_put = buildCall() //
  .args<rt.Static<typeof travelExpensePassenger_putArgsRt>>()
  .method('put')
  .path((args) => `/travelExpense/passenger/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: TravelExpensePassenger_delete

const travelExpensePassenger_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: TravelExpensePassenger_delete
 * `DELETE: /travelExpense/passenger/{id}`
 */
export const TravelExpensePassenger_delete = buildCall() //
  .args<rt.Static<typeof travelExpensePassenger_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/travelExpense/passenger/${args.id}`)
  .build();

// Operation: TravelExpensePerDiemCompensation_search

const travelExpensePerDiemCompensation_searchArgsRt = rt
  .Record({
    travelExpenseId: rt.String,
    rateTypeId: rt.String,
    rateCategoryId: rt.String,
    overnightAccommodation: rt.Union(
      rt.Literal('NONE'),
      rt.Literal('HOTEL'),
      rt.Literal('BOARDING_HOUSE_WITHOUT_COOKING'),
      rt.Literal('BOARDING_HOUSE_WITH_COOKING'),
    ),
    countFrom: rt.Number,
    countTo: rt.Number,
    rateFrom: rt.String,
    rateTo: rt.String,
    amountFrom: rt.String,
    amountTo: rt.String,
    location: rt.String,
    address: rt.String,
    isDeductionForBreakfast: rt.Boolean,
    isLunchDeduction: rt.Boolean,
    isDinnerDeduction: rt.Boolean,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpensePerDiemCompensation_search
 * `GET: /travelExpense/perDiemCompensation`
 */
export const TravelExpensePerDiemCompensation_search = buildCall() //
  .args<rt.Static<typeof travelExpensePerDiemCompensation_searchArgsRt>>()
  .method('get')
  .path('/travelExpense/perDiemCompensation')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'travelExpenseId',
          'rateTypeId',
          'rateCategoryId',
          'overnightAccommodation',
          'countFrom',
          'countTo',
          'rateFrom',
          'rateTo',
          'amountFrom',
          'amountTo',
          'location',
          'address',
          'isDeductionForBreakfast',
          'isLunchDeduction',
          'isDinnerDeduction',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: TravelExpensePerDiemCompensation_post

const travelExpensePerDiemCompensation_postArgsRt = rt
  .Record({ body: perDiemCompensationRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpensePerDiemCompensation_post
 * `POST: /travelExpense/perDiemCompensation`
 */
export const TravelExpensePerDiemCompensation_post = buildCall() //
  .args<rt.Static<typeof travelExpensePerDiemCompensation_postArgsRt>>()
  .method('post')
  .path('/travelExpense/perDiemCompensation')
  .body((args) => args.body)
  .build();

// Operation: TravelExpensePerDiemCompensation_get

const travelExpensePerDiemCompensation_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpensePerDiemCompensation_get
 * `GET: /travelExpense/perDiemCompensation/{id}`
 */
export const TravelExpensePerDiemCompensation_get = buildCall() //
  .args<rt.Static<typeof travelExpensePerDiemCompensation_getArgsRt>>()
  .method('get')
  .path((args) => `/travelExpense/perDiemCompensation/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TravelExpensePerDiemCompensation_put

const travelExpensePerDiemCompensation_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: perDiemCompensationRt }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpensePerDiemCompensation_put
 * `PUT: /travelExpense/perDiemCompensation/{id}`
 */
export const TravelExpensePerDiemCompensation_put = buildCall() //
  .args<rt.Static<typeof travelExpensePerDiemCompensation_putArgsRt>>()
  .method('put')
  .path((args) => `/travelExpense/perDiemCompensation/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: TravelExpensePerDiemCompensation_delete

const travelExpensePerDiemCompensation_deleteArgsRt = rt
  .Record({ id: rt.Number })
  .asReadonly();

/**
 * operation ID: TravelExpensePerDiemCompensation_delete
 * `DELETE: /travelExpense/perDiemCompensation/{id}`
 */
export const TravelExpensePerDiemCompensation_delete = buildCall() //
  .args<rt.Static<typeof travelExpensePerDiemCompensation_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/travelExpense/perDiemCompensation/${args.id}`)
  .build();

// Operation: TravelExpense_search

const travelExpense_searchArgsRt = rt
  .Record({
    employeeId: rt.String,
    departmentId: rt.String,
    projectId: rt.String,
    projectManagerId: rt.String,
    departureDateFrom: rt.String,
    returnDateTo: rt.String,
    state: rt.Union(
      rt.Literal('ALL'),
      rt.Literal('OPEN'),
      rt.Literal('APPROVED'),
      rt.Literal('SALARY_PAID'),
      rt.Literal('DELIVERED'),
    ),
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpense_search
 * `GET: /travelExpense`
 */
export const TravelExpense_search = buildCall() //
  .args<rt.Static<typeof travelExpense_searchArgsRt>>()
  .method('get')
  .path('/travelExpense')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'employeeId',
          'departmentId',
          'projectId',
          'projectManagerId',
          'departureDateFrom',
          'returnDateTo',
          'state',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: TravelExpense_post

const travelExpense_postArgsRt = rt
  .Record({ body: travelExpenseRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpense_post
 * `POST: /travelExpense`
 */
export const TravelExpense_post = buildCall() //
  .args<rt.Static<typeof travelExpense_postArgsRt>>()
  .method('post')
  .path('/travelExpense')
  .body((args) => args.body)
  .build();

// Operation: TravelExpenseApprove_approve

const travelExpenseApprove_approveArgsRt = rt
  .Record({ id: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpenseApprove_approve
 * `PUT: /travelExpense/:approve`
 */
export const TravelExpenseApprove_approve = buildCall() //
  .args<rt.Static<typeof travelExpenseApprove_approveArgsRt>>()
  .method('put')
  .path('/travelExpense/:approve')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'id')))
  .build();

// Operation: TravelExpenseAttachment_downloadAttachment

const travelExpenseAttachment_downloadAttachmentArgsRt = rt
  .Record({ travelExpenseId: rt.Number })
  .asReadonly();

/**
 * operation ID: TravelExpenseAttachment_downloadAttachment
 * `GET: /travelExpense/{travelExpenseId}/attachment`
 */
export const TravelExpenseAttachment_downloadAttachment = buildCall() //
  .args<rt.Static<typeof travelExpenseAttachment_downloadAttachmentArgsRt>>()
  .method('get')
  .path((args) => `/travelExpense/${args.travelExpenseId}/attachment`)
  .build();

// Operation: TravelExpenseAttachment_uploadAttachment

const travelExpenseAttachment_uploadAttachmentArgsRt = rt.Intersect(
  rt.Record({ travelExpenseId: rt.Number, file: rt.Unknown }).asReadonly(),
  rt.Record({ createNewCost: rt.Boolean }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpenseAttachment_uploadAttachment
 * `POST: /travelExpense/{travelExpenseId}/attachment`
 */
export const TravelExpenseAttachment_uploadAttachment = buildCall() //
  .args<rt.Static<typeof travelExpenseAttachment_uploadAttachmentArgsRt>>()
  .method('post')
  .path((args) => `/travelExpense/${args.travelExpenseId}/attachment`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'createNewCost')))
  .build();

// Operation: TravelExpenseAttachment_deleteAttachment

const travelExpenseAttachment_deleteAttachmentArgsRt = rt.Intersect(
  rt.Record({ travelExpenseId: rt.Number }).asReadonly(),
  rt
    .Record({ version: rt.Number, sendToInbox: rt.Boolean, split: rt.Boolean })
    .asPartial()
    .asReadonly(),
);

/**
 * operation ID: TravelExpenseAttachment_deleteAttachment
 * `DELETE: /travelExpense/{travelExpenseId}/attachment`
 */
export const TravelExpenseAttachment_deleteAttachment = buildCall() //
  .args<rt.Static<typeof travelExpenseAttachment_deleteAttachmentArgsRt>>()
  .method('delete')
  .path((args) => `/travelExpense/${args.travelExpenseId}/attachment`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'version', 'sendToInbox', 'split'),
      ),
  )
  .build();

// Operation: TravelExpenseDeliver_deliver

const travelExpenseDeliver_deliverArgsRt = rt
  .Record({ id: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpenseDeliver_deliver
 * `PUT: /travelExpense/:deliver`
 */
export const TravelExpenseDeliver_deliver = buildCall() //
  .args<rt.Static<typeof travelExpenseDeliver_deliverArgsRt>>()
  .method('put')
  .path('/travelExpense/:deliver')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'id')))
  .build();

// Operation: TravelExpenseUndeliver_undeliver

const travelExpenseUndeliver_undeliverArgsRt = rt
  .Record({ id: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpenseUndeliver_undeliver
 * `PUT: /travelExpense/:undeliver`
 */
export const TravelExpenseUndeliver_undeliver = buildCall() //
  .args<rt.Static<typeof travelExpenseUndeliver_undeliverArgsRt>>()
  .method('put')
  .path('/travelExpense/:undeliver')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'id')))
  .build();

// Operation: TravelExpenseUnapprove_unapprove

const travelExpenseUnapprove_unapproveArgsRt = rt
  .Record({ id: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpenseUnapprove_unapprove
 * `PUT: /travelExpense/:unapprove`
 */
export const TravelExpenseUnapprove_unapprove = buildCall() //
  .args<rt.Static<typeof travelExpenseUnapprove_unapproveArgsRt>>()
  .method('put')
  .path('/travelExpense/:unapprove')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'id')))
  .build();

// Operation: TravelExpenseCreateVouchers_createVouchers

const travelExpenseCreateVouchers_createVouchersArgsRt = rt.Intersect(
  rt.Record({ date: rt.String }).asReadonly(),
  rt.Record({ id: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpenseCreateVouchers_createVouchers
 * `PUT: /travelExpense/:createVouchers`
 */
export const TravelExpenseCreateVouchers_createVouchers = buildCall() //
  .args<rt.Static<typeof travelExpenseCreateVouchers_createVouchersArgsRt>>()
  .method('put')
  .path('/travelExpense/:createVouchers')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'id', 'date')))
  .build();

// Operation: TravelExpenseAttachmentList_uploadAttachments

const travelExpenseAttachmentList_uploadAttachmentsArgsRt = rt.Intersect(
  rt
    .Record({ travelExpenseId: rt.Number, body: formDataMultiPartRt })
    .asReadonly(),
  rt.Record({ createNewCost: rt.Boolean }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpenseAttachmentList_uploadAttachments
 * `POST: /travelExpense/{travelExpenseId}/attachment/list`
 */
export const TravelExpenseAttachmentList_uploadAttachments = buildCall() //
  .args<rt.Static<typeof travelExpenseAttachmentList_uploadAttachmentsArgsRt>>()
  .method('post')
  .path((args) => `/travelExpense/${args.travelExpenseId}/attachment/list`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'createNewCost')))
  .body((args) => args.body)
  .build();

// Operation: TravelExpense_get

const travelExpense_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpense_get
 * `GET: /travelExpense/{id}`
 */
export const TravelExpense_get = buildCall() //
  .args<rt.Static<typeof travelExpense_getArgsRt>>()
  .method('get')
  .path((args) => `/travelExpense/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TravelExpense_put

const travelExpense_putArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ body: travelExpenseRt }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpense_put
 * `PUT: /travelExpense/{id}`
 */
export const TravelExpense_put = buildCall() //
  .args<rt.Static<typeof travelExpense_putArgsRt>>()
  .method('put')
  .path((args) => `/travelExpense/${args.id}`)
  .body((args) => args.body)
  .build();

// Operation: TravelExpense_delete

const travelExpense_deleteArgsRt = rt.Record({ id: rt.Number }).asReadonly();

/**
 * operation ID: TravelExpense_delete
 * `DELETE: /travelExpense/{id}`
 */
export const TravelExpense_delete = buildCall() //
  .args<rt.Static<typeof travelExpense_deleteArgsRt>>()
  .method('delete')
  .path((args) => `/travelExpense/${args.id}`)
  .build();

// Operation: TravelExpenseCopy_copy

const travelExpenseCopy_copyArgsRt = rt.Record({ id: rt.Number }).asReadonly();

/**
 * operation ID: TravelExpenseCopy_copy
 * `PUT: /travelExpense/:copy`
 */
export const TravelExpenseCopy_copy = buildCall() //
  .args<rt.Static<typeof travelExpenseCopy_copyArgsRt>>()
  .method('put')
  .path('/travelExpense/:copy')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'id')))
  .build();

// Operation: TravelExpenseRate_search

const travelExpenseRate_searchArgsRt = rt
  .Record({
    rateCategoryId: rt.String,
    type: rt.Union(
      rt.Literal('PER_DIEM'),
      rt.Literal('ACCOMMODATION_ALLOWANCE'),
      rt.Literal('MILEAGE_ALLOWANCE'),
    ),
    isValidDayTrip: rt.Boolean,
    isValidAccommodation: rt.Boolean,
    isValidDomestic: rt.Boolean,
    isValidForeignTravel: rt.Boolean,
    requiresZone: rt.Boolean,
    requiresOvernightAccommodation: rt.Boolean,
    dateFrom: rt.String,
    dateTo: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpenseRate_search
 * `GET: /travelExpense/rate`
 */
export const TravelExpenseRate_search = buildCall() //
  .args<rt.Static<typeof travelExpenseRate_searchArgsRt>>()
  .method('get')
  .path('/travelExpense/rate')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'rateCategoryId',
          'type',
          'isValidDayTrip',
          'isValidAccommodation',
          'isValidDomestic',
          'isValidForeignTravel',
          'requiresZone',
          'requiresOvernightAccommodation',
          'dateFrom',
          'dateTo',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: TravelExpenseRate_get

const travelExpenseRate_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpenseRate_get
 * `GET: /travelExpense/rate/{id}`
 */
export const TravelExpenseRate_get = buildCall() //
  .args<rt.Static<typeof travelExpenseRate_getArgsRt>>()
  .method('get')
  .path((args) => `/travelExpense/rate/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TravelExpenseRateCategory_search

const travelExpenseRateCategory_searchArgsRt = rt
  .Record({
    type: rt.Union(
      rt.Literal('PER_DIEM'),
      rt.Literal('ACCOMMODATION_ALLOWANCE'),
      rt.Literal('MILEAGE_ALLOWANCE'),
    ),
    name: rt.String,
    travelReportRateCategoryGroupId: rt.Number,
    ameldingWageCode: rt.String,
    wageCodeNumber: rt.String,
    isValidDayTrip: rt.Boolean,
    isValidAccommodation: rt.Boolean,
    isValidDomestic: rt.Boolean,
    requiresZone: rt.Boolean,
    isRequiresOvernightAccommodation: rt.Boolean,
    dateFrom: rt.String,
    dateTo: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpenseRateCategory_search
 * `GET: /travelExpense/rateCategory`
 */
export const TravelExpenseRateCategory_search = buildCall() //
  .args<rt.Static<typeof travelExpenseRateCategory_searchArgsRt>>()
  .method('get')
  .path('/travelExpense/rateCategory')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'type',
          'name',
          'travelReportRateCategoryGroupId',
          'ameldingWageCode',
          'wageCodeNumber',
          'isValidDayTrip',
          'isValidAccommodation',
          'isValidDomestic',
          'requiresZone',
          'isRequiresOvernightAccommodation',
          'dateFrom',
          'dateTo',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: TravelExpenseRateCategory_get

const travelExpenseRateCategory_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpenseRateCategory_get
 * `GET: /travelExpense/rateCategory/{id}`
 */
export const TravelExpenseRateCategory_get = buildCall() //
  .args<rt.Static<typeof travelExpenseRateCategory_getArgsRt>>()
  .method('get')
  .path((args) => `/travelExpense/rateCategory/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TravelExpenseRateCategoryGroup_search

const travelExpenseRateCategoryGroup_searchArgsRt = rt
  .Record({
    name: rt.String,
    isForeignTravel: rt.Boolean,
    dateFrom: rt.String,
    dateTo: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpenseRateCategoryGroup_search
 * `GET: /travelExpense/rateCategoryGroup`
 */
export const TravelExpenseRateCategoryGroup_search = buildCall() //
  .args<rt.Static<typeof travelExpenseRateCategoryGroup_searchArgsRt>>()
  .method('get')
  .path('/travelExpense/rateCategoryGroup')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'name',
          'isForeignTravel',
          'dateFrom',
          'dateTo',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: TravelExpenseRateCategoryGroup_get

const travelExpenseRateCategoryGroup_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpenseRateCategoryGroup_get
 * `GET: /travelExpense/rateCategoryGroup/{id}`
 */
export const TravelExpenseRateCategoryGroup_get = buildCall() //
  .args<rt.Static<typeof travelExpenseRateCategoryGroup_getArgsRt>>()
  .method('get')
  .path((args) => `/travelExpense/rateCategoryGroup/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TravelExpenseCostCategory_get

const travelExpenseCostCategory_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpenseCostCategory_get
 * `GET: /travelExpense/costCategory/{id}`
 */
export const TravelExpenseCostCategory_get = buildCall() //
  .args<rt.Static<typeof travelExpenseCostCategory_getArgsRt>>()
  .method('get')
  .path((args) => `/travelExpense/costCategory/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TravelExpenseCostCategory_search

const travelExpenseCostCategory_searchArgsRt = rt
  .Record({
    id: rt.String,
    description: rt.String,
    isInactive: rt.Boolean,
    showOnEmployeeExpenses: rt.Boolean,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpenseCostCategory_search
 * `GET: /travelExpense/costCategory`
 */
export const TravelExpenseCostCategory_search = buildCall() //
  .args<rt.Static<typeof travelExpenseCostCategory_searchArgsRt>>()
  .method('get')
  .path('/travelExpense/costCategory')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'description',
          'isInactive',
          'showOnEmployeeExpenses',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: TravelExpensePaymentType_get

const travelExpensePaymentType_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpensePaymentType_get
 * `GET: /travelExpense/paymentType/{id}`
 */
export const TravelExpensePaymentType_get = buildCall() //
  .args<rt.Static<typeof travelExpensePaymentType_getArgsRt>>()
  .method('get')
  .path((args) => `/travelExpense/paymentType/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TravelExpensePaymentType_search

const travelExpensePaymentType_searchArgsRt = rt
  .Record({
    id: rt.String,
    description: rt.String,
    isInactive: rt.Boolean,
    showOnEmployeeExpenses: rt.Boolean,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpensePaymentType_search
 * `GET: /travelExpense/paymentType`
 */
export const TravelExpensePaymentType_search = buildCall() //
  .args<rt.Static<typeof travelExpensePaymentType_searchArgsRt>>()
  .method('get')
  .path('/travelExpense/paymentType')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'description',
          'isInactive',
          'showOnEmployeeExpenses',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: TravelExpenseSettings_get

const travelExpenseSettings_getArgsRt = rt
  .Record({ fields: rt.String })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpenseSettings_get
 * `GET: /travelExpense/settings`
 */
export const TravelExpenseSettings_get = buildCall() //
  .args<rt.Static<typeof travelExpenseSettings_getArgsRt>>()
  .method('get')
  .path('/travelExpense/settings')
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TravelExpenseZone_get

const travelExpenseZone_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: TravelExpenseZone_get
 * `GET: /travelExpense/zone/{id}`
 */
export const TravelExpenseZone_get = buildCall() //
  .args<rt.Static<typeof travelExpenseZone_getArgsRt>>()
  .method('get')
  .path((args) => `/travelExpense/zone/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();

// Operation: TravelExpenseZone_search

const travelExpenseZone_searchArgsRt = rt
  .Record({
    id: rt.String,
    code: rt.String,
    isDisabled: rt.Boolean,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: TravelExpenseZone_search
 * `GET: /travelExpense/zone`
 */
export const TravelExpenseZone_search = buildCall() //
  .args<rt.Static<typeof travelExpenseZone_searchArgsRt>>()
  .method('get')
  .path('/travelExpense/zone')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'id',
          'code',
          'isDisabled',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: VoucherMessage_search

const voucherMessage_searchArgsRt = rt
  .Record({
    voucherIds: rt.String,
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: VoucherMessage_search
 * `GET: /voucherMessage`
 */
export const VoucherMessage_search = buildCall() //
  .args<rt.Static<typeof voucherMessage_searchArgsRt>>()
  .method('get')
  .path('/voucherMessage')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'voucherIds',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: VoucherMessage_post

const voucherMessage_postArgsRt = rt
  .Record({ body: voucherMessageRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: VoucherMessage_post
 * `POST: /voucherMessage`
 */
export const VoucherMessage_post = buildCall() //
  .args<rt.Static<typeof voucherMessage_postArgsRt>>()
  .method('post')
  .path('/voucherMessage')
  .body((args) => args.body)
  .build();

// Operation: VoucherStatus_search

const voucherStatus_searchArgsRt = rt
  .Record({
    ids: rt.String,
    voucherIds: rt.String,
    status: rt.Union(
      rt.Literal('WAITING'),
      rt.Literal('DONE'),
      rt.Literal('SKIPPED'),
      rt.Literal('ERROR'),
      rt.Literal('NONE'),
      rt.Literal('PROCESSING'),
      rt.Literal('RECLAIMED'),
    ),
    type: rt.Union(
      rt.Literal('TRIPLETEX'),
      rt.Literal('SUPPLIERINVOICE_EXTERNAL'),
      rt.Literal('DEBT_COLLECTION'),
    ),
    from: rt.Number,
    count: rt.Number,
    sorting: rt.String,
    fields: rt.String,
  })
  .asPartial()
  .asReadonly();

/**
 * operation ID: VoucherStatus_search
 * `GET: /voucherStatus`
 */
export const VoucherStatus_search = buildCall() //
  .args<rt.Static<typeof voucherStatus_searchArgsRt>>()
  .method('get')
  .path('/voucherStatus')
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'ids',
          'voucherIds',
          'status',
          'type',
          'from',
          'count',
          'sorting',
          'fields',
        ),
      ),
  )
  .build();

// Operation: VoucherStatus_post

const voucherStatus_postArgsRt = rt
  .Record({ body: voucherStatusRt })
  .asPartial()
  .asReadonly();

/**
 * operation ID: VoucherStatus_post
 * `POST: /voucherStatus`
 */
export const VoucherStatus_post = buildCall() //
  .args<rt.Static<typeof voucherStatus_postArgsRt>>()
  .method('post')
  .path('/voucherStatus')
  .body((args) => args.body)
  .build();

// Operation: VoucherStatus_get

const voucherStatus_getArgsRt = rt.Intersect(
  rt.Record({ id: rt.Number }).asReadonly(),
  rt.Record({ fields: rt.String }).asPartial().asReadonly(),
);

/**
 * operation ID: VoucherStatus_get
 * `GET: /voucherStatus/{id}`
 */
export const VoucherStatus_get = buildCall() //
  .args<rt.Static<typeof voucherStatus_getArgsRt>>()
  .method('get')
  .path((args) => `/voucherStatus/${args.id}`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'fields')))
  .build();
