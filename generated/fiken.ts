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

const accountBalanceSchemaRt = rt.Record({ balance: rt.Number });

type AccountBalanceSchema = rt.Static<typeof accountBalanceSchemaRt>;

const accountSchemaRt = rt.Record({ code: rt.String, name: rt.String });

type AccountSchema = rt.Static<typeof accountSchemaRt>;

const addressSchemaRt = rt.Intersect(
  rt.Record({ streetAddressLine2: rt.String }),
  rt
    .Record({
      streetAddress: rt.String,
      city: rt.String,
      postCode: rt.String,
      country: rt.String,
    })
    .asPartial(),
);

type AddressSchema = rt.Static<typeof addressSchemaRt>;

const attachmentSchemaRt = rt.Record({
  identifier: rt.String,
  downloadUrl: rt.String,
  downloadUrlWithFikenNormalUserCredentials: rt.String,
  comment: rt.String,
  type: rt.Union(rt.Literal('invoice'), rt.Literal('reminder')),
});

type AttachmentSchema = rt.Static<typeof attachmentSchemaRt>;

const bankAccountRequestSchemaRt = rt.Intersect(
  rt.Record({
    bic: rt.String,
    iban: rt.String,
    foreignService: rt.String,
    inactive: rt.Boolean,
  }),
  rt
    .Record({
      name: rt.String,
      bankAccountNumber: rt.String,
      type: rt.Union(
        rt.Literal('normal'),
        rt.Literal('tax_deduction'),
        rt.Literal('foreign'),
        rt.Literal('credit_card'),
      ),
    })
    .asPartial(),
);

type BankAccountRequestSchema = rt.Static<typeof bankAccountRequestSchemaRt>;

const bankAccountResultSchemaRt = rt.Record({
  name: rt.String,
  accountCode: rt.String,
  bankAccountNumber: rt.String,
  iban: rt.String,
  bic: rt.String,
  foreignService: rt.String,
  type: rt.Union(
    rt.Literal('normal'),
    rt.Literal('tax_deduction'),
    rt.Literal('foreign'),
    rt.Literal('credit_card'),
  ),
  reconciledBalance: rt.Number,
  reconciledDate: rt.String,
});

type BankAccountResultSchema = rt.Static<typeof bankAccountResultSchemaRt>;

const companySchemaRt = rt.Record({
  name: rt.String,
  slug: rt.String,
  organizationNumber: rt.String,
  vatType: rt.Union(
    rt.Literal('no'),
    rt.Literal('yearly'),
    rt.Literal('monthly'),
    rt.Literal('bi-monthly'),
  ),
  address: addressSchemaRt,
  phoneNumber: rt.String,
  email: rt.String,
  creationDate: rt.String,
  hasApiAccess: rt.Boolean,
  testCompany: rt.Boolean,
  accountingStartDate: rt.String,
});

type CompanySchema = rt.Static<typeof companySchemaRt>;

const contactPersonSchemaRt = rt.Intersect(
  rt.Record({
    contactPersonId: rt.Number,
    phoneNumber: rt.String,
    address: addressSchemaRt,
  }),
  rt.Record({ name: rt.String, email: rt.String }).asPartial(),
);

type ContactPersonSchema = rt.Static<typeof contactPersonSchemaRt>;

const contactSchemaRt = rt.Intersect(
  rt.Record({
    contactId: rt.Number,
    lastModifiedDate: rt.String,
    email: rt.String,
    organizationNumber: rt.String,
    customerNumber: rt.Number,
    customerAccountCode: rt.String,
    phoneNumber: rt.String,
    memberNumber: rt.Number,
    supplierNumber: rt.Number,
    supplierAccountCode: rt.String,
    customer: rt.Boolean,
    supplier: rt.Boolean,
    contactPerson: rt.Array(contactPersonSchemaRt),
    currency: rt.String,
    language: rt.String,
    inactive: rt.Boolean,
    daysUntilInvoicingDueDate: rt.Number,
    address: addressSchemaRt,
    groups: rt.Array(rt.String),
  }),
  rt.Record({ name: rt.String }).asPartial(),
);

type ContactSchema = rt.Static<typeof contactSchemaRt>;

const creditNoteLineResultSchemaRt = rt.Intersect(
  rt.Record({
    incomeAccount: rt.String,
    vatType: rt.String,
    discount: rt.Number,
    productId: rt.Number,
    description: rt.String,
    comment: rt.String,
  }),
  rt.Record({ unitPrice: rt.Number, quantity: rt.Number }).asPartial(),
);

type CreditNoteLineResultSchema = rt.Static<
  typeof creditNoteLineResultSchemaRt
>;

const invoiceLineResultSchemaRt = rt.Record({
  net: rt.Number,
  vat: rt.Number,
  vatType: rt.String,
  gross: rt.Number,
  netInNok: rt.Number,
  vatInNok: rt.Number,
  grossInNok: rt.Number,
  vatInPercent: rt.Number,
  unitPrice: rt.Number,
  quantity: rt.Number,
  discount: rt.Number,
  productId: rt.Number,
  productName: rt.String,
  description: rt.String,
  comment: rt.String,
  incomeAccount: rt.String,
});

type InvoiceLineResultSchema = rt.Static<typeof invoiceLineResultSchemaRt>;

const projectResultSchemaRt = rt.Record({
  projectId: rt.Number,
  number: rt.String,
  name: rt.String,
  description: rt.String,
  startDate: rt.String,
  endDate: rt.String,
  contact: contactSchemaRt,
  completed: rt.Boolean,
});

type ProjectResultSchema = rt.Static<typeof projectResultSchemaRt>;

const creditNoteResultSchemaRt = rt.Intersect(
  rt.Record({
    kid: rt.String,
    creditNoteText: rt.String,
    yourReference: rt.String,
    ourReference: rt.String,
    orderReference: rt.String,
    lines: rt.Array(invoiceLineResultSchemaRt),
    currency: rt.String,
    issueDate: rt.String,
    settled: rt.Boolean,
    associatedInvoiceId: rt.Number,
    creditNotePdf: attachmentSchemaRt,
    project: projectResultSchemaRt,
  }),
  rt
    .Record({
      creditNoteId: rt.Number,
      creditNoteNumber: rt.Number,
      customer: contactSchemaRt,
      net: rt.Number,
      vat: rt.Number,
      gross: rt.Number,
      netInNok: rt.Number,
      vatInNok: rt.Number,
      grossInNok: rt.Number,
      address: addressSchemaRt,
    })
    .asPartial(),
);

type CreditNoteResultSchema = rt.Static<typeof creditNoteResultSchemaRt>;

const draftLineRequestSchemaRt = rt.Intersect(
  rt.Record({ projectId: rt.Number }),
  rt
    .Record({
      text: rt.String,
      vatType: rt.String,
      incomeAccount: rt.String,
      net: rt.Number,
      gross: rt.Number,
    })
    .asPartial(),
);

type DraftLineRequestSchema = rt.Static<typeof draftLineRequestSchemaRt>;

const draftLineResultSchemaRt = rt.Record({
  text: rt.String,
  vatType: rt.String,
  incomeAccount: rt.String,
  net: rt.Number,
  gross: rt.Number,
  project: projectResultSchemaRt,
});

type DraftLineResultSchema = rt.Static<typeof draftLineResultSchemaRt>;

const paymentSchemaRt = rt.Intersect(
  rt.Record({
    paymentId: rt.Number,
    amountInNok: rt.Number,
    currency: rt.String,
    fee: rt.Number,
  }),
  rt
    .Record({ date: rt.String, account: rt.String, amount: rt.Number })
    .asPartial(),
);

type PaymentSchema = rt.Static<typeof paymentSchemaRt>;

const draftRequestSchemaRt = rt.Intersect(
  rt.Record({
    invoiceIssueDate: rt.String,
    dueDate: rt.String,
    invoiceNumber: rt.String,
    contactId: rt.Number,
    projectId: rt.Number,
    currency: rt.String,
    kid: rt.String,
    paid: rt.Boolean,
    payments: rt.Array(paymentSchemaRt),
  }),
  rt
    .Record({ cash: rt.Boolean, lines: rt.Array(draftLineRequestSchemaRt) })
    .asPartial(),
);

type DraftRequestSchema = rt.Static<typeof draftRequestSchemaRt>;

const draftResultSchemaRt = rt.Record({
  draftId: rt.Number,
  uuid: rt.String,
  invoiceIssueDate: rt.String,
  dueDate: rt.String,
  invoiceNumber: rt.String,
  contact: contactSchemaRt,
  project: projectResultSchemaRt,
  cash: rt.Boolean,
  currency: rt.String,
  kid: rt.String,
  paid: rt.Boolean,
  attachments: rt.Array(attachmentSchemaRt),
  payments: rt.Array(paymentSchemaRt),
  lines: rt.Array(draftLineResultSchemaRt),
});

type DraftResultSchema = rt.Static<typeof draftResultSchemaRt>;

const fullCreditNoteRequestSchemaRt = rt.Intersect(
  rt.Record({ creditNoteText: rt.String }),
  rt.Record({ issueDate: rt.String, invoiceId: rt.Number }).asPartial(),
);

type FullCreditNoteRequestSchema = rt.Static<
  typeof fullCreditNoteRequestSchemaRt
>;

const journalEntryLineSchemaRt = rt.Intersect(
  rt.Record({
    account: rt.String,
    vatCode: rt.String,
    debitAccount: rt.String,
    debitVatCode: rt.Number,
    creditAccount: rt.String,
    creditVatCode: rt.Number,
  }),
  rt.Record({ amount: rt.Number }).asPartial(),
);

type JournalEntryLineSchema = rt.Static<typeof journalEntryLineSchemaRt>;

const journalEntrySchemaRt = rt.Intersect(
  rt.Record({
    journalEntryId: rt.Number,
    transactionId: rt.Number,
    journalEntryNumber: rt.Number,
    attachments: rt.Array(attachmentSchemaRt),
  }),
  rt
    .Record({
      description: rt.String,
      date: rt.String,
      lines: rt.Array(journalEntryLineSchemaRt),
    })
    .asPartial(),
);

type JournalEntrySchema = rt.Static<typeof journalEntrySchemaRt>;

const generalJournalEntryRequestSchemaRt = rt.Intersect(
  rt.Record({ description: rt.String }),
  rt.Record({ journalEntries: rt.Array(journalEntrySchemaRt) }).asPartial(),
);

type GeneralJournalEntryRequestSchema = rt.Static<
  typeof generalJournalEntryRequestSchemaRt
>;

const inboxResultSchemaRt = rt.Record({
  documentId: rt.Number,
  name: rt.String,
  description: rt.String,
  filename: rt.String,
  status: rt.Boolean,
  createdAt: rt.String,
});

type InboxResultSchema = rt.Static<typeof inboxResultSchemaRt>;

const invoiceishDraftLineSchemaRt = rt.Intersect(
  rt.Record({
    productId: rt.Number,
    description: rt.String,
    unitPrice: rt.Number,
    vatType: rt.String,
    discount: rt.Number,
    comment: rt.String,
    incomeAccount: rt.String,
  }),
  rt.Record({ quantity: rt.Number }).asPartial(),
);

type InvoiceishDraftLineSchema = rt.Static<typeof invoiceishDraftLineSchemaRt>;

const invoiceishDraftRequestSchemaRt = rt.Intersect(
  rt.Record({
    uuid: rt.String,
    issueDate: rt.String,
    invoiceText: rt.String,
    yourReference: rt.String,
    ourReference: rt.String,
    orderReference: rt.String,
    lines: rt.Array(invoiceishDraftLineSchemaRt),
    currency: rt.String,
    bankAccountNumber: rt.String,
    iban: rt.String,
    bic: rt.String,
    paymentAccount: rt.String,
    contactPersonId: rt.Number,
    projectId: rt.Number,
  }),
  rt
    .Record({
      type: rt.Union(
        rt.Literal('invoice'),
        rt.Literal('cash_invoice'),
        rt.Literal('offer'),
        rt.Literal('order_confirmation'),
        rt.Literal('credit_note'),
      ),
      daysUntilDueDate: rt.Number,
      customerId: rt.Number,
    })
    .asPartial(),
);

type InvoiceishDraftRequestSchema = rt.Static<
  typeof invoiceishDraftRequestSchemaRt
>;

const invoiceishDraftResultSchemaRt = rt.Record({
  draftId: rt.Number,
  uuid: rt.String,
  type: rt.Union(
    rt.Literal('invoice'),
    rt.Literal('cash_invoice'),
    rt.Literal('offer'),
    rt.Literal('order_confirmation'),
    rt.Literal('credit_note'),
    rt.Literal('repeating_invoice'),
  ),
  issueDate: rt.String,
  daysUntilDueDate: rt.Number,
  invoiceText: rt.String,
  currency: rt.String,
  yourReference: rt.String,
  ourReference: rt.String,
  orderReference: rt.String,
  lines: rt.Array(invoiceishDraftLineSchemaRt),
  bankAccountNumber: rt.String,
  iban: rt.String,
  bic: rt.String,
  paymentAccount: rt.String,
  customers: rt.Array(contactSchemaRt),
  attachments: rt.Array(attachmentSchemaRt),
  createdFromInvoiceId: rt.Number,
  projectId: rt.Number,
});

type InvoiceishDraftResultSchema = rt.Static<
  typeof invoiceishDraftResultSchemaRt
>;

const invoiceLineRequestSchemaRt = rt.Intersect(
  rt.Record({
    net: rt.Number,
    vat: rt.Number,
    vatType: rt.String,
    gross: rt.Number,
    vatInPercent: rt.Number,
    unitPrice: rt.Number,
    discount: rt.Number,
    productName: rt.String,
    productId: rt.Number,
    description: rt.String,
    comment: rt.String,
    incomeAccount: rt.String,
  }),
  rt.Record({ quantity: rt.Number }).asPartial(),
);

type InvoiceLineRequestSchema = rt.Static<typeof invoiceLineRequestSchemaRt>;

const invoiceRequestSchemaRt = rt.Intersect(
  rt.Record({
    uuid: rt.String,
    ourReference: rt.String,
    yourReference: rt.String,
    orderReference: rt.String,
    contactPersonId: rt.Number,
    currency: rt.String,
    invoiceText: rt.String,
    paymentAccount: rt.String,
    projectId: rt.Number,
  }),
  rt
    .Record({
      issueDate: rt.String,
      dueDate: rt.String,
      lines: rt.Array(invoiceLineRequestSchemaRt),
      customerId: rt.Number,
      bankAccountCode: rt.String,
      cash: rt.Boolean,
    })
    .asPartial(),
);

type InvoiceRequestSchema = rt.Static<typeof invoiceRequestSchemaRt>;

const orderLineSchemaRt = rt.Intersect(
  rt.Record({
    description: rt.String,
    netPrice: rt.Number,
    vat: rt.Number,
    account: rt.String,
    netPriceInCurrency: rt.Number,
    vatInCurrency: rt.Number,
    projectId: rt.Number,
  }),
  rt.Record({ vatType: rt.String }).asPartial(),
);

type OrderLineSchema = rt.Static<typeof orderLineSchemaRt>;

const saleResultSchemaRt = rt.Record({
  saleId: rt.Number,
  transactionId: rt.Number,
  saleNumber: rt.String,
  date: rt.String,
  kind: rt.Union(
    rt.Literal('cash_sale'),
    rt.Literal('invoice'),
    rt.Literal('external_invoice'),
  ),
  netAmount: rt.Number,
  vatAmount: rt.Number,
  settled: rt.Boolean,
  writeOff: rt.Boolean,
  totalPaid: rt.Number,
  totalPaidInCurrency: rt.Number,
  outstandingBalance: rt.Number,
  lines: rt.Array(orderLineSchemaRt),
  customer: contactSchemaRt,
  currency: rt.String,
  dueDate: rt.String,
  kid: rt.String,
  paymentAccount: rt.String,
  salePayments: rt.Array(paymentSchemaRt),
  saleAttachments: rt.Array(attachmentSchemaRt),
  paymentDate: rt.String,
  project: projectResultSchemaRt,
  deleted: rt.Boolean,
});

type SaleResultSchema = rt.Static<typeof saleResultSchemaRt>;

const invoiceResultSchemaRt = rt.Record({
  invoiceId: rt.Number,
  invoiceNumber: rt.Number,
  kid: rt.String,
  issueDate: rt.String,
  dueDate: rt.String,
  originalDueDate: rt.String,
  net: rt.Number,
  vat: rt.Number,
  gross: rt.Number,
  netInNok: rt.Number,
  vatInNok: rt.Number,
  grossInNok: rt.Number,
  cash: rt.Boolean,
  invoiceText: rt.String,
  yourReference: rt.String,
  ourReference: rt.String,
  orderReference: rt.String,
  address: addressSchemaRt,
  lines: rt.Array(invoiceLineResultSchemaRt),
  currency: rt.String,
  bankAccountNumber: rt.String,
  sentManually: rt.Boolean,
  invoicePdf: attachmentSchemaRt,
  associatedCreditNotes: rt.Array(rt.Number),
  attachments: rt.Array(attachmentSchemaRt),
  customer: contactSchemaRt,
  sale: saleResultSchemaRt,
  project: projectResultSchemaRt,
});

type InvoiceResultSchema = rt.Static<typeof invoiceResultSchemaRt>;

const offerSchemaRt = rt.Record({
  offerId: rt.Number,
  offerDraftUuid: rt.String,
  date: rt.String,
  offerNumber: rt.Number,
  net: rt.Number,
  vat: rt.Number,
  gross: rt.Number,
  comment: rt.String,
  yourReference: rt.String,
  ourReference: rt.String,
  orderReference: rt.String,
  discount: rt.Number,
  address: addressSchemaRt,
  lines: rt.Array(invoiceLineResultSchemaRt),
  currency: rt.String,
  contactId: rt.Number,
  contactPersonId: rt.Number,
  projectId: rt.Number,
});

type OfferSchema = rt.Static<typeof offerSchemaRt>;

const orderConfirmationSchemaRt = rt.Record({
  confirmationId: rt.Number,
  confirmationDraftUuid: rt.String,
  date: rt.String,
  confirmationNumber: rt.Number,
  net: rt.Number,
  vat: rt.Number,
  gross: rt.Number,
  comment: rt.String,
  yourReference: rt.String,
  ourReference: rt.String,
  orderReference: rt.String,
  discount: rt.Number,
  address: addressSchemaRt,
  lines: rt.Array(invoiceLineResultSchemaRt),
  currency: rt.String,
  contactId: rt.Number,
  contactPersonId: rt.Number,
  projectId: rt.Number,
});

type OrderConfirmationSchema = rt.Static<typeof orderConfirmationSchemaRt>;

const partialCreditNoteRequestSchemaRt = rt.Intersect(
  rt.Record({
    ourReference: rt.String,
    yourReference: rt.String,
    orderReference: rt.String,
    project: rt.Number,
    currency: rt.String,
    invoiceId: rt.Number,
    contactId: rt.Number,
    contactPersonId: rt.Number,
    creditNoteText: rt.String,
  }),
  rt
    .Record({
      issueDate: rt.String,
      lines: rt.Array(creditNoteLineResultSchemaRt),
    })
    .asPartial(),
);

type PartialCreditNoteRequestSchema = rt.Static<
  typeof partialCreditNoteRequestSchemaRt
>;

const productSchemaRt = rt.Intersect(
  rt.Record({
    productId: rt.Number,
    createdDate: rt.String,
    lastModifiedDate: rt.String,
    unitPrice: rt.Number,
    incomeAccount: rt.String,
    productNumber: rt.String,
    stock: rt.Number,
    note: rt.String,
  }),
  rt
    .Record({ name: rt.String, vatType: rt.String, active: rt.Boolean })
    .asPartial(),
);

type ProductSchema = rt.Static<typeof productSchemaRt>;

const productSalesLineInfoSchemaRt = rt.Record({
  count: rt.Number,
  sales: rt.Number,
  netAmount: rt.Number,
  vatAmount: rt.Number,
  grossAmount: rt.Number,
});

type ProductSalesLineInfoSchema = rt.Static<
  typeof productSalesLineInfoSchemaRt
>;

const productSalesReportRequestSchemaRt = rt
  .Record({ from: rt.String, to: rt.String })
  .asPartial();

type ProductSalesReportRequestSchema = rt.Static<
  typeof productSalesReportRequestSchemaRt
>;

const productSalesReportResultSchemaRt = rt.Record({
  product: productSchemaRt,
  sold: productSalesLineInfoSchemaRt,
  credited: productSalesLineInfoSchemaRt,
  sum: productSalesLineInfoSchemaRt,
});

type ProductSalesReportResultSchema = rt.Static<
  typeof productSalesReportResultSchemaRt
>;

const projectRequestSchemaRt = rt.Intersect(
  rt.Record({
    number: rt.String,
    name: rt.String,
    description: rt.String,
    endDate: rt.String,
    contactId: rt.Number,
    completed: rt.Boolean,
  }),
  rt.Record({ startDate: rt.String }).asPartial(),
);

type ProjectRequestSchema = rt.Static<typeof projectRequestSchemaRt>;

const purchaseRequestSchemaRt = rt.Intersect(
  rt.Record({
    transactionId: rt.Number,
    identifier: rt.String,
    dueDate: rt.String,
    supplierId: rt.Number,
    paymentAccount: rt.String,
    paymentDate: rt.String,
    kid: rt.String,
    projectId: rt.Number,
  }),
  rt
    .Record({
      date: rt.String,
      kind: rt.Union(rt.Literal('cash_purchase'), rt.Literal('supplier')),
      lines: rt.Array(orderLineSchemaRt),
      currency: rt.String,
    })
    .asPartial(),
);

type PurchaseRequestSchema = rt.Static<typeof purchaseRequestSchemaRt>;

const purchaseResultSchemaRt = rt.Intersect(
  rt.Record({
    purchaseId: rt.Number,
    transactionId: rt.Number,
    identifier: rt.String,
    dueDate: rt.String,
    supplier: contactSchemaRt,
    paymentAccount: rt.String,
    paymentDate: rt.String,
    payments: rt.Array(paymentSchemaRt),
    purchaseAttachments: rt.Array(attachmentSchemaRt),
    kid: rt.String,
    project: rt.Array(projectResultSchemaRt),
    deleted: rt.Boolean,
  }),
  rt
    .Record({
      date: rt.String,
      kind: rt.Union(rt.Literal('cash_purchase'), rt.Literal('supplier')),
      paid: rt.Boolean,
      lines: rt.Array(orderLineSchemaRt),
      currency: rt.String,
    })
    .asPartial(),
);

type PurchaseResultSchema = rt.Static<typeof purchaseResultSchemaRt>;

const saleRequestSchemaRt = rt.Intersect(
  rt.Record({
    saleNumber: rt.String,
    settled: rt.Boolean,
    totalPaid: rt.Number,
    totalPaidInCurrency: rt.Number,
    outstandingBalance: rt.Number,
    customerId: rt.Number,
    dueDate: rt.String,
    kid: rt.String,
    paymentAccount: rt.String,
    paymentDate: rt.String,
    paymentFee: rt.Number,
    projectId: rt.Number,
  }),
  rt
    .Record({
      date: rt.String,
      kind: rt.Union(
        rt.Literal('cash_sale'),
        rt.Literal('invoice'),
        rt.Literal('external_invoice'),
      ),
      lines: rt.Array(orderLineSchemaRt),
      currency: rt.String,
    })
    .asPartial(),
);

type SaleRequestSchema = rt.Static<typeof saleRequestSchemaRt>;

const sendFakturaisjRequestSchemaRt = rt.Intersect(
  rt.Record({
    recipientName: rt.String,
    recipientEmail: rt.String,
    message: rt.String,
    emailSendOption: rt.Union(
      rt.Literal('document_link'),
      rt.Literal('attachment'),
      rt.Literal('auto'),
    ),
    organizationNumber: rt.String,
    mobileNumber: rt.String,
  }),
  rt
    .Record({
      method: rt.Array(
        rt.Union(
          rt.Literal('email'),
          rt.Literal('ehf'),
          rt.Literal('vipps'),
          rt.Literal('sms'),
          rt.Literal('auto'),
        ),
      ),
      includeDocumentAttachments: rt.Boolean,
    })
    .asPartial(),
);

type SendFakturaisjRequestSchema = rt.Static<
  typeof sendFakturaisjRequestSchemaRt
>;

const sendCreditNoteRequestSchemaRt = rt
  .Record({ creditNoteId: rt.Number })
  .asPartial();

type SendCreditNoteRequestSchema = rt.Static<
  typeof sendCreditNoteRequestSchemaRt
>;

const sendInvoiceRequestSchemaRt = rt
  .Record({ invoiceId: rt.Number })
  .asPartial();

type SendInvoiceRequestSchema = rt.Static<typeof sendInvoiceRequestSchemaRt>;

const transactionSchemaRt = rt.Record({
  transactionId: rt.Number,
  description: rt.String,
  type: rt.String,
  entries: rt.Array(journalEntrySchemaRt),
});

type TransactionSchema = rt.Static<typeof transactionSchemaRt>;

const updateInvoiceRequestSchemaRt = rt.Intersect(
  rt.Record({ newDueDate: rt.String }),
  rt.Record({ sentManually: rt.Boolean }).asPartial(),
);

type UpdateInvoiceRequestSchema = rt.Static<
  typeof updateInvoiceRequestSchemaRt
>;

const updateProjectRequestSchemaRt = rt.Record({
  name: rt.String,
  description: rt.String,
  startDate: rt.String,
  endDate: rt.String,
  contactId: rt.Number,
  completed: rt.Boolean,
});

type UpdateProjectRequestSchema = rt.Static<
  typeof updateProjectRequestSchemaRt
>;

const userinfoSchemaRt = rt.Record({ name: rt.String, email: rt.String });

type UserinfoSchema = rt.Static<typeof userinfoSchemaRt>;

// Operation: getUser

/**
 * operation ID: getUser
 * `GET: /user`
 * Returns information about the user
 */
export const getUser = buildCall() //
  .method('get')
  .path('/user')
  .parseJson(withRuntype(userinfoSchemaRt))
  .build();

// Operation: getCompanies

const getCompaniesArgsRt = rt
  .Record({
    page: rt.Number,
    pageSize: rt.Number,
    sortBy: rt.Union(
      rt.Literal('createdDate asc'),
      rt.Literal('createdDate desc'),
      rt.Literal('name asc'),
      rt.Literal('name desc'),
      rt.Literal('organizationNumber asc'),
      rt.Literal('organizationNumber desc'),
    ),
  })
  .asPartial()
  .asReadonly();

const getCompaniesResponseBodyRt = rt.Array(companySchemaRt);

/**
 * operation ID: getCompanies
 * `GET: /companies`
 * Returns all companies from the system that the user has
 * access to
 */
export const getCompanies = buildCall() //
  .args<rt.Static<typeof getCompaniesArgsRt>>()
  .method('get')
  .path('/companies')
  .query(
    (args) =>
      new URLSearchParams(pickQueryValues(args, 'page', 'pageSize', 'sortBy')),
  )
  .parseJson(withRuntype(getCompaniesResponseBodyRt))
  .build();

// Operation: getCompany

const getCompanyArgsRt = rt.Record({ companySlug: rt.String }).asReadonly();

/**
 * operation ID: getCompany
 * `GET: /companies/{companySlug}`
 * Returns company associated with slug.
 */
export const getCompany = buildCall() //
  .args<rt.Static<typeof getCompanyArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}`)
  .parseJson(withRuntype(companySchemaRt))
  .build();

// Operation: getAccounts

const getAccountsArgsRt = rt.Intersect(
  rt.Record({ companySlug: rt.String }).asReadonly(),
  rt
    .Record({
      fromAccount: rt.Number,
      toAccount: rt.Number,
      page: rt.Number,
      pageSize: rt.Number,
    })
    .asPartial()
    .asReadonly(),
);

const getAccountsResponseBodyRt = rt.Array(accountSchemaRt);

/**
 * operation ID: getAccounts
 * `GET: /companies/{companySlug}/accounts`
 * Retrieves the bookkeeping accounts for the current year
 */
export const getAccounts = buildCall() //
  .args<rt.Static<typeof getAccountsArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/accounts`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'fromAccount', 'toAccount', 'page', 'pageSize'),
      ),
  )
  .parseJson(withRuntype(getAccountsResponseBodyRt))
  .build();

// Operation: getAccount

const getAccountArgsRt = rt
  .Record({ companySlug: rt.String, accountCode: rt.String })
  .asReadonly();

/**
 * operation ID: getAccount
 * `GET: /companies/{companySlug}/accounts/{accountCode}`
 * Retrieves the specified bookkeping account. An account is a
 * string with either four digits, or four digits, a colon and
 * five digits ("reskontro").       Examples:       3020 and
 * 1500:10001
 */
export const getAccount = buildCall() //
  .args<rt.Static<typeof getAccountArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/accounts/${args.accountCode}`)
  .parseJson(withRuntype(accountSchemaRt))
  .build();

// Operation: getAccountBalances

const getAccountBalancesArgsRt = rt.Intersect(
  rt.Record({ companySlug: rt.String, date: rt.String }).asReadonly(),
  rt
    .Record({
      fromAccount: rt.Number,
      toAccount: rt.Number,
      page: rt.Number,
      pageSize: rt.Number,
    })
    .asPartial()
    .asReadonly(),
);

const getAccountBalancesResponseBodyRt = rt.Array(accountBalanceSchemaRt);

/**
 * operation ID: getAccountBalances
 * `GET: /companies/{companySlug}/accountBalances`
 * Retrieves the bookkeeping accounts and balances for a given
 * date. An account is a string with either four digits, or
 * four digits, a colon and five digits ("reskontro").
 * Examples: 3020 and 1500:10001
 */
export const getAccountBalances = buildCall() //
  .args<rt.Static<typeof getAccountBalancesArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/accountBalances`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'fromAccount',
          'toAccount',
          'page',
          'pageSize',
          'date',
        ),
      ),
  )
  .parseJson(withRuntype(getAccountBalancesResponseBodyRt))
  .build();

// Operation: getAccountBalance

const getAccountBalanceArgsRt = rt
  .Record({ companySlug: rt.String, accountCode: rt.String, date: rt.String })
  .asReadonly();

/**
 * operation ID: getAccountBalance
 * `GET:
 * /companies/{companySlug}/accountBalances/{accountCode}`
 * Retrieves the specified bookkeping account and balance for a
 * given date.
 */
export const getAccountBalance = buildCall() //
  .args<rt.Static<typeof getAccountBalanceArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/accountBalances/${args.accountCode}`,
  )
  .query((args) => new URLSearchParams(pickQueryValues(args, 'date')))
  .parseJson(withRuntype(accountBalanceSchemaRt))
  .build();

// Operation: getBankAccounts

const getBankAccountsArgsRt = rt.Intersect(
  rt.Record({ companySlug: rt.String }).asReadonly(),
  rt.Record({ page: rt.Number, pageSize: rt.Number }).asPartial().asReadonly(),
);

const getBankAccountsResponseBodyRt = rt.Array(bankAccountResultSchemaRt);

/**
 * operation ID: getBankAccounts
 * `GET: /companies/{companySlug}/bankAccounts`
 * Retrieves all bank accounts associated with the company.
 */
export const getBankAccounts = buildCall() //
  .args<rt.Static<typeof getBankAccountsArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/bankAccounts`)
  .query(
    (args) => new URLSearchParams(pickQueryValues(args, 'page', 'pageSize')),
  )
  .parseJson(withRuntype(getBankAccountsResponseBodyRt))
  .build();

// Operation: createBankAccount

const createBankAccountArgsRt = rt
  .Record({ companySlug: rt.String, requestBody: bankAccountRequestSchemaRt })
  .asReadonly();

/**
 * operation ID: createBankAccount
 * `POST: /companies/{companySlug}/bankAccounts`
 * Creates a new bank account. The Location response header
 * returns the URL of the newly created bank account. Possible
 * types of bank accounts are NORMAL, TAX_DEDUCTION, FOREIGN,
 * and CREDIT_CARD. The field "foreignService" should only be
 * filled out for accounts of type FOREIGN.
 */
export const createBankAccount = buildCall() //
  .args<rt.Static<typeof createBankAccountArgsRt>>()
  .method('post')
  .path((args) => `/companies/${args.companySlug}/bankAccounts`)
  .body((args) => args.requestBody)
  .build();

// Operation: getBankAccount

const getBankAccountArgsRt = rt
  .Record({ companySlug: rt.String, bankAccountId: rt.Number })
  .asReadonly();

/**
 * operation ID: getBankAccount
 * `GET: /companies/{companySlug}/bankAccounts/{bankAccountId}`
 * Retrieves specified bank account.
 */
export const getBankAccount = buildCall() //
  .args<rt.Static<typeof getBankAccountArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/bankAccounts/${args.bankAccountId}`,
  )
  .parseJson(withRuntype(bankAccountResultSchemaRt))
  .build();

// Operation: getContacts

const getContactsArgsRt = rt.Intersect(
  rt.Record({ companySlug: rt.String }).asReadonly(),
  rt
    .Record({
      page: rt.Number,
      pageSize: rt.Number,
      lastModified: rt.String,
      lastModifiedLe: rt.String,
      lastModifiedLt: rt.String,
      lastModifiedGe: rt.String,
      lastModifiedGt: rt.String,
      supplierNumber: rt.Number,
      customerNumber: rt.Number,
      memberNumber: rt.Number,
      name: rt.String,
      organizationNumber: rt.String,
      email: rt.String,
      customer: rt.Boolean,
      supplier: rt.Boolean,
      inactive: rt.Boolean,
      group: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

const getContactsResponseBodyRt = rt.Array(contactSchemaRt);

/**
 * operation ID: getContacts
 * `GET: /companies/{companySlug}/contacts`
 * Retrieves all contacts for the specified company.
 */
export const getContacts = buildCall() //
  .args<rt.Static<typeof getContactsArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/contacts`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'page',
          'pageSize',
          'lastModified',
          'lastModifiedLe',
          'lastModifiedLt',
          'lastModifiedGe',
          'lastModifiedGt',
          'supplierNumber',
          'customerNumber',
          'memberNumber',
          'name',
          'organizationNumber',
          'email',
          'customer',
          'supplier',
          'inactive',
          'group',
        ),
      ),
  )
  .parseJson(withRuntype(getContactsResponseBodyRt))
  .build();

// Operation: createContact

const createContactArgsRt = rt
  .Record({ companySlug: rt.String, requestBody: contactSchemaRt })
  .asReadonly();

/**
 * operation ID: createContact
 * `POST: /companies/{companySlug}/contacts`
 * Creates a new contact. The Location response header returns
 * the URL of the newly created contact.
 */
export const createContact = buildCall() //
  .args<rt.Static<typeof createContactArgsRt>>()
  .method('post')
  .path((args) => `/companies/${args.companySlug}/contacts`)
  .body((args) => args.requestBody)
  .build();

// Operation: getContact

const getContactArgsRt = rt
  .Record({ companySlug: rt.String, contactId: rt.Number })
  .asReadonly();

/**
 * operation ID: getContact
 * `GET: /companies/{companySlug}/contacts/{contactId}`
 * Retrieves specified contact. ContactId is returned with a
 * GET contacts call as the first returned field. ContactId is
 * returned in the Location response header for POST contact.
 */
export const getContact = buildCall() //
  .args<rt.Static<typeof getContactArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/contacts/${args.contactId}`)
  .parseJson(withRuntype(contactSchemaRt))
  .build();

// Operation: updateContact

const updateContactArgsRt = rt
  .Record({
    companySlug: rt.String,
    contactId: rt.Number,
    requestBody: contactSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: updateContact
 * `PUT: /companies/{companySlug}/contacts/{contactId}`
 * Updates an existing contact.
 */
export const updateContact = buildCall() //
  .args<rt.Static<typeof updateContactArgsRt>>()
  .method('put')
  .path((args) => `/companies/${args.companySlug}/contacts/${args.contactId}`)
  .body((args) => args.requestBody)
  .build();

// Operation: getContactContactPerson

const getContactContactPersonArgsRt = rt
  .Record({ companySlug: rt.String, contactId: rt.Number })
  .asReadonly();

const getContactContactPersonResponseBodyRt = rt.Array(contactPersonSchemaRt);

/**
 * operation ID: getContactContactPerson
 * `GET:
 * /companies/{companySlug}/contacts/{contactId}/contactPerson`
 * Retrieves contact person(s) for a specified contact.
 */
export const getContactContactPerson = buildCall() //
  .args<rt.Static<typeof getContactContactPersonArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/contacts/${args.contactId}/contactPerson`,
  )
  .parseJson(withRuntype(getContactContactPersonResponseBodyRt))
  .build();

// Operation: addContactPersonToContact

const addContactPersonToContactArgsRt = rt
  .Record({
    companySlug: rt.String,
    contactId: rt.Number,
    requestBody: contactPersonSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: addContactPersonToContact
 * `POST:
 * /companies/{companySlug}/contacts/{contactId}/contactPerson`
 * Adds a new contact person to a contact
 */
export const addContactPersonToContact = buildCall() //
  .args<rt.Static<typeof addContactPersonToContactArgsRt>>()
  .method('post')
  .path(
    (args) =>
      `/companies/${args.companySlug}/contacts/${args.contactId}/contactPerson`,
  )
  .body((args) => args.requestBody)
  .build();

// Operation: getContactPerson

const getContactPersonArgsRt = rt
  .Record({
    companySlug: rt.String,
    contactId: rt.Number,
    contactPersonId: rt.Number,
  })
  .asReadonly();

/**
 * operation ID: getContactPerson
 * `GET:
 * /companies/{companySlug}/contacts/{contactId}/contactPerson/{contactPersonId}`
 * Retrieves specified contact person
 */
export const getContactPerson = buildCall() //
  .args<rt.Static<typeof getContactPersonArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/contacts/${args.contactId}/contactPerson/${args.contactPersonId}`,
  )
  .parseJson(withRuntype(contactPersonSchemaRt))
  .build();

// Operation: updateContactContactPerson

const updateContactContactPersonArgsRt = rt
  .Record({
    companySlug: rt.String,
    contactId: rt.Number,
    contactPersonId: rt.Number,
    requestBody: contactPersonSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: updateContactContactPerson
 * `PUT:
 * /companies/{companySlug}/contacts/{contactId}/contactPerson/{contactPersonId}`
 * Updates an existing contact person.
 */
export const updateContactContactPerson = buildCall() //
  .args<rt.Static<typeof updateContactContactPersonArgsRt>>()
  .method('put')
  .path(
    (args) =>
      `/companies/${args.companySlug}/contacts/${args.contactId}/contactPerson/${args.contactPersonId}`,
  )
  .body((args) => args.requestBody)
  .build();

// Operation: deleteContactContactPerson

const deleteContactContactPersonArgsRt = rt
  .Record({
    companySlug: rt.String,
    contactId: rt.Number,
    contactPersonId: rt.Number,
  })
  .asReadonly();

/**
 * operation ID: deleteContactContactPerson
 * `DELETE:
 * /companies/{companySlug}/contacts/{contactId}/contactPerson/{contactPersonId}`
 * Delete a contact's contact person.
 */
export const deleteContactContactPerson = buildCall() //
  .args<rt.Static<typeof deleteContactContactPersonArgsRt>>()
  .method('delete')
  .path(
    (args) =>
      `/companies/${args.companySlug}/contacts/${args.contactId}/contactPerson/${args.contactPersonId}`,
  )
  .build();

// Operation: createProductSalesReport

const createProductSalesReportArgsRt = rt
  .Record({
    companySlug: rt.String,
    requestBody: productSalesReportRequestSchemaRt,
  })
  .asReadonly();

const createProductSalesReportResponseBodyRt = rt.Array(
  productSalesReportResultSchemaRt,
);

/**
 * operation ID: createProductSalesReport
 * `POST: /companies/{companySlug}/products/salesReport`
 * Creates a report based on provided specifications.
 */
export const createProductSalesReport = buildCall() //
  .args<rt.Static<typeof createProductSalesReportArgsRt>>()
  .method('post')
  .path((args) => `/companies/${args.companySlug}/products/salesReport`)
  .body((args) => args.requestBody)
  .parseJson(withRuntype(createProductSalesReportResponseBodyRt))
  .build();

// Operation: getJournalEntries

const getJournalEntriesArgsRt = rt.Intersect(
  rt.Record({ companySlug: rt.String }).asReadonly(),
  rt
    .Record({
      page: rt.Number,
      pageSize: rt.Number,
      date: rt.String,
      dateLe: rt.String,
      dateLt: rt.String,
      dateGe: rt.String,
      dateGt: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

const getJournalEntriesResponseBodyRt = rt.Array(journalEntrySchemaRt);

/**
 * operation ID: getJournalEntries
 * `GET: /companies/{companySlug}/journalEntries`
 * Returns all general journal entries (posteringer) for the
 * specified company.
 */
export const getJournalEntries = buildCall() //
  .args<rt.Static<typeof getJournalEntriesArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/journalEntries`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'page',
          'pageSize',
          'date',
          'dateLe',
          'dateLt',
          'dateGe',
          'dateGt',
        ),
      ),
  )
  .parseJson(withRuntype(getJournalEntriesResponseBodyRt))
  .build();

// Operation: createGeneralJournalEntry

const createGeneralJournalEntryArgsRt = rt
  .Record({
    companySlug: rt.String,
    requestBody: generalJournalEntryRequestSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: createGeneralJournalEntry
 * `POST: /companies/{companySlug}/generalJournalEntries`
 * Creates a new general journal entry (fri postering).
 */
export const createGeneralJournalEntry = buildCall() //
  .args<rt.Static<typeof createGeneralJournalEntryArgsRt>>()
  .method('post')
  .path((args) => `/companies/${args.companySlug}/generalJournalEntries`)
  .body((args) => args.requestBody)
  .build();

// Operation: getJournalEntry

const getJournalEntryArgsRt = rt
  .Record({ companySlug: rt.String, journalEntryId: rt.Number })
  .asReadonly();

/**
 * operation ID: getJournalEntry
 * `GET:
 * /companies/{companySlug}/journalEntries/{journalEntryId}`
 * Returns all journal entries within a given company's Journal
 * Entry Service
 */
export const getJournalEntry = buildCall() //
  .args<rt.Static<typeof getJournalEntryArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/journalEntries/${args.journalEntryId}`,
  )
  .parseJson(withRuntype(journalEntrySchemaRt))
  .build();

// Operation: getJournalEntryAttachments

const getJournalEntryAttachmentsArgsRt = rt
  .Record({ companySlug: rt.String, journalEntryId: rt.Number })
  .asReadonly();

const getJournalEntryAttachmentsResponseBodyRt = rt.Array(attachmentSchemaRt);

/**
 * operation ID: getJournalEntryAttachments
 * `GET:
 * /companies/{companySlug}/journalEntries/{journalEntryId}/attachments`
 * Returns all attachments for a given Journal Entry
 */
export const getJournalEntryAttachments = buildCall() //
  .args<rt.Static<typeof getJournalEntryAttachmentsArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/journalEntries/${args.journalEntryId}/attachments`,
  )
  .parseJson(withRuntype(getJournalEntryAttachmentsResponseBodyRt))
  .build();

// Operation: addAttachmentToJournalEntry

const addAttachmentToJournalEntryArgsRt = rt
  .Record({ companySlug: rt.String, journalEntryId: rt.Number })
  .asReadonly();

/**
 * operation ID: addAttachmentToJournalEntry
 * `POST:
 * /companies/{companySlug}/journalEntries/{journalEntryId}/attachments`
 * Creates and adds a new attachment to a Journal Entry
 */
export const addAttachmentToJournalEntry = buildCall() //
  .args<rt.Static<typeof addAttachmentToJournalEntryArgsRt>>()
  .method('post')
  .path(
    (args) =>
      `/companies/${args.companySlug}/journalEntries/${args.journalEntryId}/attachments`,
  )
  .build();

// Operation: getTransaction

const getTransactionArgsRt = rt
  .Record({ companySlug: rt.String, transactionId: rt.Number })
  .asReadonly();

/**
 * operation ID: getTransaction
 * `GET: /companies/{companySlug}/transactions/{transactionId}`
 * Returns given transaction with associated id. Transaction id
 * is returned in GET calls for sales, purchases, and journal
 * entries.
 */
export const getTransaction = buildCall() //
  .args<rt.Static<typeof getTransactionArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/transactions/${args.transactionId}`,
  )
  .parseJson(withRuntype(transactionSchemaRt))
  .build();

// Operation: getInvoices

const getInvoicesArgsRt = rt.Intersect(
  rt.Record({ companySlug: rt.String }).asReadonly(),
  rt
    .Record({
      page: rt.Number,
      pageSize: rt.Number,
      issueDate: rt.String,
      issueDateLe: rt.String,
      issueDateLt: rt.String,
      issueDateGe: rt.String,
      issueDateGt: rt.String,
      lastModified: rt.String,
      lastModifiedLe: rt.String,
      lastModifiedLt: rt.String,
      lastModifiedGe: rt.String,
      lastModifiedGt: rt.String,
      customerId: rt.Number,
      settled: rt.Boolean,
      orderReference: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

const getInvoicesResponseBodyRt = rt.Array(invoiceResultSchemaRt);

/**
 * operation ID: getInvoices
 * `GET: /companies/{companySlug}/invoices`
 * Returns all invoices for given company. You can filter based
 * on issue date, last modified date, customer ID, and if the
 * invoice is settled or not.
 */
export const getInvoices = buildCall() //
  .args<rt.Static<typeof getInvoicesArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/invoices`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'page',
          'pageSize',
          'issueDate',
          'issueDateLe',
          'issueDateLt',
          'issueDateGe',
          'issueDateGt',
          'lastModified',
          'lastModifiedLe',
          'lastModifiedLt',
          'lastModifiedGe',
          'lastModifiedGt',
          'customerId',
          'settled',
          'orderReference',
        ),
      ),
  )
  .parseJson(withRuntype(getInvoicesResponseBodyRt))
  .build();

// Operation: createInvoice

const createInvoiceArgsRt = rt
  .Record({ companySlug: rt.String, requestBody: invoiceRequestSchemaRt })
  .asReadonly();

/**
 * operation ID: createInvoice
 * `POST: /companies/{companySlug}/invoices`
 * Creates an invoice. There are two types of invoice lines
 * that can be added to an invoice line: product line or free
 * text line. Provide a product Id if you are invoicing a
 * product. All information regarding the price and VAT for
 * this product will be added to the invoice. It is however
 * also possible to override the unit amount by sending
 * information in both fields "productId" and "unitAmount". An
 * invoice line can also be a free text line meaning that no
 * existing product will be associated with the invoiced line.
 * In this case all information regarding the price and VAT of
 * the product or service to be invoiced must be provided.
 */
export const createInvoice = buildCall() //
  .args<rt.Static<typeof createInvoiceArgsRt>>()
  .method('post')
  .path((args) => `/companies/${args.companySlug}/invoices`)
  .body((args) => args.requestBody)
  .build();

// Operation: getInvoice

const getInvoiceArgsRt = rt
  .Record({ companySlug: rt.String, invoiceId: rt.Number })
  .asReadonly();

/**
 * operation ID: getInvoice
 * `GET: /companies/{companySlug}/invoices/{invoiceId}`
 * Returns invoice with specified id.
 */
export const getInvoice = buildCall() //
  .args<rt.Static<typeof getInvoiceArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/invoices/${args.invoiceId}`)
  .parseJson(withRuntype(invoiceResultSchemaRt))
  .build();

// Operation: updateInvoice

const updateInvoiceArgsRt = rt
  .Record({
    companySlug: rt.String,
    invoiceId: rt.Number,
    requestBody: updateInvoiceRequestSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: updateInvoice
 * `PATCH: /companies/{companySlug}/invoices/{invoiceId}`
 * Updates invoice with provided id. It is possible to update
 * the due date of an invoice as well as if the invoice was
 * sent manually, outside of Fiken.
 */
export const updateInvoice = buildCall() //
  .args<rt.Static<typeof updateInvoiceArgsRt>>()
  .method('patch')
  .path((args) => `/companies/${args.companySlug}/invoices/${args.invoiceId}`)
  .body((args) => args.requestBody)
  .build();

// Operation: getInvoiceAttachments

const getInvoiceAttachmentsArgsRt = rt
  .Record({ companySlug: rt.String, invoiceId: rt.Number })
  .asReadonly();

const getInvoiceAttachmentsResponseBodyRt = rt.Array(attachmentSchemaRt);

/**
 * operation ID: getInvoiceAttachments
 * `GET:
 * /companies/{companySlug}/invoices/{invoiceId}/attachments`
 * Returns all attachments for a given Invoice
 */
export const getInvoiceAttachments = buildCall() //
  .args<rt.Static<typeof getInvoiceAttachmentsArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/invoices/${args.invoiceId}/attachments`,
  )
  .parseJson(withRuntype(getInvoiceAttachmentsResponseBodyRt))
  .build();

// Operation: addAttachmentToInvoice

const addAttachmentToInvoiceArgsRt = rt
  .Record({ companySlug: rt.String, invoiceId: rt.Number })
  .asReadonly();

/**
 * operation ID: addAttachmentToInvoice
 * `POST:
 * /companies/{companySlug}/invoices/{invoiceId}/attachments`
 * Creates and adds a new attachment to an Invoice
 */
export const addAttachmentToInvoice = buildCall() //
  .args<rt.Static<typeof addAttachmentToInvoiceArgsRt>>()
  .method('post')
  .path(
    (args) =>
      `/companies/${args.companySlug}/invoices/${args.invoiceId}/attachments`,
  )
  .build();

// Operation: sendInvoice

const sendInvoiceArgsRt = rt
  .Record({ companySlug: rt.String, requestBody: sendInvoiceRequestSchemaRt })
  .asReadonly();

/**
 * operation ID: sendInvoice
 * `POST: /companies/{companySlug}/invoices/send`
 * Sends the specified document
 */
export const sendInvoice = buildCall() //
  .args<rt.Static<typeof sendInvoiceArgsRt>>()
  .method('post')
  .path((args) => `/companies/${args.companySlug}/invoices/send`)
  .body((args) => args.requestBody)
  .build();

// Operation: getInvoiceDrafts

const getInvoiceDraftsArgsRt = rt.Intersect(
  rt.Record({ companySlug: rt.String }).asReadonly(),
  rt
    .Record({ page: rt.Number, pageSize: rt.Number, orderReference: rt.String })
    .asPartial()
    .asReadonly(),
);

const getInvoiceDraftsResponseBodyRt = rt.Array(invoiceishDraftResultSchemaRt);

/**
 * operation ID: getInvoiceDrafts
 * `GET: /companies/{companySlug}/invoices/drafts`
 * Returns all invoice drafts for given company.
 */
export const getInvoiceDrafts = buildCall() //
  .args<rt.Static<typeof getInvoiceDraftsArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/invoices/drafts`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'page', 'pageSize', 'orderReference'),
      ),
  )
  .parseJson(withRuntype(getInvoiceDraftsResponseBodyRt))
  .build();

// Operation: createInvoiceDraft

const createInvoiceDraftArgsRt = rt
  .Record({
    companySlug: rt.String,
    requestBody: invoiceishDraftRequestSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: createInvoiceDraft
 * `POST: /companies/{companySlug}/invoices/drafts`
 * Creates an invoice draft.
 */
export const createInvoiceDraft = buildCall() //
  .args<rt.Static<typeof createInvoiceDraftArgsRt>>()
  .method('post')
  .path((args) => `/companies/${args.companySlug}/invoices/drafts`)
  .body((args) => args.requestBody)
  .build();

// Operation: getInvoiceDraft

const getInvoiceDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: getInvoiceDraft
 * `GET: /companies/{companySlug}/invoices/drafts/{draftId}`
 * Returns invoice draft with specified id.
 */
export const getInvoiceDraft = buildCall() //
  .args<rt.Static<typeof getInvoiceDraftArgsRt>>()
  .method('get')
  .path(
    (args) => `/companies/${args.companySlug}/invoices/drafts/${args.draftId}`,
  )
  .parseJson(withRuntype(invoiceishDraftResultSchemaRt))
  .build();

// Operation: updateInvoiceDraft

const updateInvoiceDraftArgsRt = rt
  .Record({
    companySlug: rt.String,
    draftId: rt.Number,
    requestBody: invoiceishDraftRequestSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: updateInvoiceDraft
 * `PUT: /companies/{companySlug}/invoices/drafts/{draftId}`
 * Updates invoice draft with provided id.
 */
export const updateInvoiceDraft = buildCall() //
  .args<rt.Static<typeof updateInvoiceDraftArgsRt>>()
  .method('put')
  .path(
    (args) => `/companies/${args.companySlug}/invoices/drafts/${args.draftId}`,
  )
  .body((args) => args.requestBody)
  .build();

// Operation: deleteInvoiceDraft

const deleteInvoiceDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: deleteInvoiceDraft
 * `DELETE: /companies/{companySlug}/invoices/drafts/{draftId}`
 * Delete invoice draft with specified id.
 */
export const deleteInvoiceDraft = buildCall() //
  .args<rt.Static<typeof deleteInvoiceDraftArgsRt>>()
  .method('delete')
  .path(
    (args) => `/companies/${args.companySlug}/invoices/drafts/${args.draftId}`,
  )
  .build();

// Operation: getInvoiceDraftAttachments

const getInvoiceDraftAttachmentsArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

const getInvoiceDraftAttachmentsResponseBodyRt = rt.Array(attachmentSchemaRt);

/**
 * operation ID: getInvoiceDraftAttachments
 * `GET:
 * /companies/{companySlug}/invoices/drafts/{draftId}/attachments`
 * Returns all attachments for specified draft.
 */
export const getInvoiceDraftAttachments = buildCall() //
  .args<rt.Static<typeof getInvoiceDraftAttachmentsArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/invoices/drafts/${args.draftId}/attachments`,
  )
  .parseJson(withRuntype(getInvoiceDraftAttachmentsResponseBodyRt))
  .build();

// Operation: addAttachmentToInvoiceDraft

const addAttachmentToInvoiceDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: addAttachmentToInvoiceDraft
 * `POST:
 * /companies/{companySlug}/invoices/drafts/{draftId}/attachments`
 * Creates and adds a new attachment to an invoice draft
 */
export const addAttachmentToInvoiceDraft = buildCall() //
  .args<rt.Static<typeof addAttachmentToInvoiceDraftArgsRt>>()
  .method('post')
  .path(
    (args) =>
      `/companies/${args.companySlug}/invoices/drafts/${args.draftId}/attachments`,
  )
  .build();

// Operation: createInvoiceFromDraft

const createInvoiceFromDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: createInvoiceFromDraft
 * `POST:
 * /companies/{companySlug}/invoices/drafts/{draftId}/createInvoice`
 * Creates an invoice from an already created draft.
 */
export const createInvoiceFromDraft = buildCall() //
  .args<rt.Static<typeof createInvoiceFromDraftArgsRt>>()
  .method('post')
  .path(
    (args) =>
      `/companies/${args.companySlug}/invoices/drafts/${args.draftId}/createInvoice`,
  )
  .build();

// Operation: getCreditNotes

const getCreditNotesArgsRt = rt.Intersect(
  rt.Record({ companySlug: rt.String }).asReadonly(),
  rt
    .Record({
      page: rt.Number,
      pageSize: rt.Number,
      issueDate: rt.String,
      issueDateLe: rt.String,
      issueDateLt: rt.String,
      issueDateGe: rt.String,
      issueDateGt: rt.String,
      customerId: rt.Number,
      settled: rt.Boolean,
    })
    .asPartial()
    .asReadonly(),
);

const getCreditNotesResponseBodyRt = rt.Array(creditNoteResultSchemaRt);

/**
 * operation ID: getCreditNotes
 * `GET: /companies/{companySlug}/creditNotes`
 * Returns all credit notes for given company
 */
export const getCreditNotes = buildCall() //
  .args<rt.Static<typeof getCreditNotesArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/creditNotes`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'page',
          'pageSize',
          'issueDate',
          'issueDateLe',
          'issueDateLt',
          'issueDateGe',
          'issueDateGt',
          'customerId',
          'settled',
        ),
      ),
  )
  .parseJson(withRuntype(getCreditNotesResponseBodyRt))
  .build();

// Operation: createFullCreditNote

const createFullCreditNoteArgsRt = rt
  .Record({
    companySlug: rt.String,
    requestBody: fullCreditNoteRequestSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: createFullCreditNote
 * `POST: /companies/{companySlug}/creditNotes/full`
 * Creates a new credit note.
 */
export const createFullCreditNote = buildCall() //
  .args<rt.Static<typeof createFullCreditNoteArgsRt>>()
  .method('post')
  .path((args) => `/companies/${args.companySlug}/creditNotes/full`)
  .body((args) => args.requestBody)
  .build();

// Operation: createPartialCreditNote

const createPartialCreditNoteArgsRt = rt
  .Record({
    companySlug: rt.String,
    requestBody: partialCreditNoteRequestSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: createPartialCreditNote
 * `POST: /companies/{companySlug}/creditNotes/partial`
 * Creates a new credit note.
 */
export const createPartialCreditNote = buildCall() //
  .args<rt.Static<typeof createPartialCreditNoteArgsRt>>()
  .method('post')
  .path((args) => `/companies/${args.companySlug}/creditNotes/partial`)
  .body((args) => args.requestBody)
  .build();

// Operation: getCreditNote

const getCreditNoteArgsRt = rt
  .Record({ companySlug: rt.String, creditNoteId: rt.String })
  .asReadonly();

/**
 * operation ID: getCreditNote
 * `GET: /companies/{companySlug}/creditNotes/{creditNoteId}`
 * Returns credit note with specified id.
 */
export const getCreditNote = buildCall() //
  .args<rt.Static<typeof getCreditNoteArgsRt>>()
  .method('get')
  .path(
    (args) => `/companies/${args.companySlug}/creditNotes/${args.creditNoteId}`,
  )
  .parseJson(withRuntype(creditNoteResultSchemaRt))
  .build();

// Operation: sendCreditNote

const sendCreditNoteArgsRt = rt
  .Record({
    companySlug: rt.String,
    requestBody: sendCreditNoteRequestSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: sendCreditNote
 * `POST: /companies/{companySlug}/creditNotes/send`
 * Sends the specified document
 */
export const sendCreditNote = buildCall() //
  .args<rt.Static<typeof sendCreditNoteArgsRt>>()
  .method('post')
  .path((args) => `/companies/${args.companySlug}/creditNotes/send`)
  .body((args) => args.requestBody)
  .build();

// Operation: getCreditNoteDrafts

const getCreditNoteDraftsArgsRt = rt.Intersect(
  rt.Record({ companySlug: rt.String }).asReadonly(),
  rt.Record({ page: rt.Number, pageSize: rt.Number }).asPartial().asReadonly(),
);

const getCreditNoteDraftsResponseBodyRt = rt.Array(
  invoiceishDraftResultSchemaRt,
);

/**
 * operation ID: getCreditNoteDrafts
 * `GET: /companies/{companySlug}/creditNotes/drafts`
 * Returns all credit note drafts for given company.
 */
export const getCreditNoteDrafts = buildCall() //
  .args<rt.Static<typeof getCreditNoteDraftsArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/creditNotes/drafts`)
  .query(
    (args) => new URLSearchParams(pickQueryValues(args, 'page', 'pageSize')),
  )
  .parseJson(withRuntype(getCreditNoteDraftsResponseBodyRt))
  .build();

// Operation: createCreditNoteDraft

const createCreditNoteDraftArgsRt = rt
  .Record({
    companySlug: rt.String,
    requestBody: invoiceishDraftRequestSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: createCreditNoteDraft
 * `POST: /companies/{companySlug}/creditNotes/drafts`
 * Creates a credit note draft.
 */
export const createCreditNoteDraft = buildCall() //
  .args<rt.Static<typeof createCreditNoteDraftArgsRt>>()
  .method('post')
  .path((args) => `/companies/${args.companySlug}/creditNotes/drafts`)
  .body((args) => args.requestBody)
  .build();

// Operation: getCreditNoteDraft

const getCreditNoteDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: getCreditNoteDraft
 * `GET: /companies/{companySlug}/creditNotes/drafts/{draftId}`
 * Returns credit note draft with specified id.
 */
export const getCreditNoteDraft = buildCall() //
  .args<rt.Static<typeof getCreditNoteDraftArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/creditNotes/drafts/${args.draftId}`,
  )
  .parseJson(withRuntype(invoiceishDraftResultSchemaRt))
  .build();

// Operation: updateCreditNoteDraft

const updateCreditNoteDraftArgsRt = rt
  .Record({
    companySlug: rt.String,
    draftId: rt.Number,
    requestBody: invoiceishDraftRequestSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: updateCreditNoteDraft
 * `PUT: /companies/{companySlug}/creditNotes/drafts/{draftId}`
 * Updates credit note draft with provided id.
 */
export const updateCreditNoteDraft = buildCall() //
  .args<rt.Static<typeof updateCreditNoteDraftArgsRt>>()
  .method('put')
  .path(
    (args) =>
      `/companies/${args.companySlug}/creditNotes/drafts/${args.draftId}`,
  )
  .body((args) => args.requestBody)
  .build();

// Operation: deleteCreditNoteDraft

const deleteCreditNoteDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: deleteCreditNoteDraft
 * `DELETE:
 * /companies/{companySlug}/creditNotes/drafts/{draftId}`
 * Delete credit note draft with specified id.
 */
export const deleteCreditNoteDraft = buildCall() //
  .args<rt.Static<typeof deleteCreditNoteDraftArgsRt>>()
  .method('delete')
  .path(
    (args) =>
      `/companies/${args.companySlug}/creditNotes/drafts/${args.draftId}`,
  )
  .build();

// Operation: getCreditNoteDraftAttachments

const getCreditNoteDraftAttachmentsArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

const getCreditNoteDraftAttachmentsResponseBodyRt =
  rt.Array(attachmentSchemaRt);

/**
 * operation ID: getCreditNoteDraftAttachments
 * `GET:
 * /companies/{companySlug}/creditNotes/drafts/{draftId}/attachments`
 * Returns all attachments for specified draft.
 */
export const getCreditNoteDraftAttachments = buildCall() //
  .args<rt.Static<typeof getCreditNoteDraftAttachmentsArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/creditNotes/drafts/${args.draftId}/attachments`,
  )
  .parseJson(withRuntype(getCreditNoteDraftAttachmentsResponseBodyRt))
  .build();

// Operation: addAttachmentToCreditNoteDraft

const addAttachmentToCreditNoteDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: addAttachmentToCreditNoteDraft
 * `POST:
 * /companies/{companySlug}/creditNotes/drafts/{draftId}/attachments`
 * Creates and adds a new attachment to a credit note draft
 */
export const addAttachmentToCreditNoteDraft = buildCall() //
  .args<rt.Static<typeof addAttachmentToCreditNoteDraftArgsRt>>()
  .method('post')
  .path(
    (args) =>
      `/companies/${args.companySlug}/creditNotes/drafts/${args.draftId}/attachments`,
  )
  .build();

// Operation: createCreditNoteFromDraft

const createCreditNoteFromDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: createCreditNoteFromDraft
 * `POST:
 * /companies/{companySlug}/creditNotes/drafts/{draftId}/createCreditNote`
 * Creates a credit note from an already created draft.
 */
export const createCreditNoteFromDraft = buildCall() //
  .args<rt.Static<typeof createCreditNoteFromDraftArgsRt>>()
  .method('post')
  .path(
    (args) =>
      `/companies/${args.companySlug}/creditNotes/drafts/${args.draftId}/createCreditNote`,
  )
  .build();

// Operation: getOffers

const getOffersArgsRt = rt.Intersect(
  rt.Record({ companySlug: rt.String }).asReadonly(),
  rt.Record({ page: rt.Number, pageSize: rt.Number }).asPartial().asReadonly(),
);

const getOffersResponseBodyRt = rt.Array(offerSchemaRt);

/**
 * operation ID: getOffers
 * `GET: /companies/{companySlug}/offers`
 * Returns all offers for given company
 */
export const getOffers = buildCall() //
  .args<rt.Static<typeof getOffersArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/offers`)
  .query(
    (args) => new URLSearchParams(pickQueryValues(args, 'page', 'pageSize')),
  )
  .parseJson(withRuntype(getOffersResponseBodyRt))
  .build();

// Operation: getOffer

const getOfferArgsRt = rt
  .Record({ companySlug: rt.String, offerId: rt.String })
  .asReadonly();

/**
 * operation ID: getOffer
 * `GET: /companies/{companySlug}/offers/{offerId}`
 * Returns offer with specified id.
 */
export const getOffer = buildCall() //
  .args<rt.Static<typeof getOfferArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/offers/${args.offerId}`)
  .parseJson(withRuntype(offerSchemaRt))
  .build();

// Operation: getOfferDrafts

const getOfferDraftsArgsRt = rt.Intersect(
  rt.Record({ companySlug: rt.String }).asReadonly(),
  rt.Record({ page: rt.Number, pageSize: rt.Number }).asPartial().asReadonly(),
);

const getOfferDraftsResponseBodyRt = rt.Array(invoiceishDraftResultSchemaRt);

/**
 * operation ID: getOfferDrafts
 * `GET: /companies/{companySlug}/offers/drafts`
 * Returns all offer drafts for given company.
 */
export const getOfferDrafts = buildCall() //
  .args<rt.Static<typeof getOfferDraftsArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/offers/drafts`)
  .query(
    (args) => new URLSearchParams(pickQueryValues(args, 'page', 'pageSize')),
  )
  .parseJson(withRuntype(getOfferDraftsResponseBodyRt))
  .build();

// Operation: createOfferDraft

const createOfferDraftArgsRt = rt
  .Record({
    companySlug: rt.String,
    requestBody: invoiceishDraftRequestSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: createOfferDraft
 * `POST: /companies/{companySlug}/offers/drafts`
 * Creates an offer draft.
 */
export const createOfferDraft = buildCall() //
  .args<rt.Static<typeof createOfferDraftArgsRt>>()
  .method('post')
  .path((args) => `/companies/${args.companySlug}/offers/drafts`)
  .body((args) => args.requestBody)
  .build();

// Operation: getOfferDraft

const getOfferDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: getOfferDraft
 * `GET: /companies/{companySlug}/offers/drafts/{draftId}`
 * Returns offer draft with specified id.
 */
export const getOfferDraft = buildCall() //
  .args<rt.Static<typeof getOfferDraftArgsRt>>()
  .method('get')
  .path(
    (args) => `/companies/${args.companySlug}/offers/drafts/${args.draftId}`,
  )
  .parseJson(withRuntype(invoiceishDraftResultSchemaRt))
  .build();

// Operation: updateOfferDraft

const updateOfferDraftArgsRt = rt
  .Record({
    companySlug: rt.String,
    draftId: rt.Number,
    requestBody: invoiceishDraftRequestSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: updateOfferDraft
 * `PUT: /companies/{companySlug}/offers/drafts/{draftId}`
 * Updates offer draft with provided id.
 */
export const updateOfferDraft = buildCall() //
  .args<rt.Static<typeof updateOfferDraftArgsRt>>()
  .method('put')
  .path(
    (args) => `/companies/${args.companySlug}/offers/drafts/${args.draftId}`,
  )
  .body((args) => args.requestBody)
  .build();

// Operation: deleteOfferDraft

const deleteOfferDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: deleteOfferDraft
 * `DELETE: /companies/{companySlug}/offers/drafts/{draftId}`
 * Delete offer draft with specified id.
 */
export const deleteOfferDraft = buildCall() //
  .args<rt.Static<typeof deleteOfferDraftArgsRt>>()
  .method('delete')
  .path(
    (args) => `/companies/${args.companySlug}/offers/drafts/${args.draftId}`,
  )
  .build();

// Operation: getOfferDraftAttachments

const getOfferDraftAttachmentsArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

const getOfferDraftAttachmentsResponseBodyRt = rt.Array(attachmentSchemaRt);

/**
 * operation ID: getOfferDraftAttachments
 * `GET:
 * /companies/{companySlug}/offers/drafts/{draftId}/attachments`
 * Returns all attachments for specified draft.
 */
export const getOfferDraftAttachments = buildCall() //
  .args<rt.Static<typeof getOfferDraftAttachmentsArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/offers/drafts/${args.draftId}/attachments`,
  )
  .parseJson(withRuntype(getOfferDraftAttachmentsResponseBodyRt))
  .build();

// Operation: addAttachmentToOfferDraft

const addAttachmentToOfferDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: addAttachmentToOfferDraft
 * `POST:
 * /companies/{companySlug}/offers/drafts/{draftId}/attachments`
 * Creates and adds a new attachment to an offer draft
 */
export const addAttachmentToOfferDraft = buildCall() //
  .args<rt.Static<typeof addAttachmentToOfferDraftArgsRt>>()
  .method('post')
  .path(
    (args) =>
      `/companies/${args.companySlug}/offers/drafts/${args.draftId}/attachments`,
  )
  .build();

// Operation: createOfferFromDraft

const createOfferFromDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: createOfferFromDraft
 * `POST:
 * /companies/{companySlug}/offers/drafts/{draftId}/createOffer`
 * Creates an offer from an already created draft.
 */
export const createOfferFromDraft = buildCall() //
  .args<rt.Static<typeof createOfferFromDraftArgsRt>>()
  .method('post')
  .path(
    (args) =>
      `/companies/${args.companySlug}/offers/drafts/${args.draftId}/createOffer`,
  )
  .build();

// Operation: getOrderConfirmations

const getOrderConfirmationsArgsRt = rt.Intersect(
  rt.Record({ companySlug: rt.String }).asReadonly(),
  rt.Record({ page: rt.Number, pageSize: rt.Number }).asPartial().asReadonly(),
);

const getOrderConfirmationsResponseBodyRt = rt.Array(orderConfirmationSchemaRt);

/**
 * operation ID: getOrderConfirmations
 * `GET: /companies/{companySlug}/orderConfirmations`
 * Returns all order confirmations for given company
 */
export const getOrderConfirmations = buildCall() //
  .args<rt.Static<typeof getOrderConfirmationsArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/orderConfirmations`)
  .query(
    (args) => new URLSearchParams(pickQueryValues(args, 'page', 'pageSize')),
  )
  .parseJson(withRuntype(getOrderConfirmationsResponseBodyRt))
  .build();

// Operation: getOrderConfirmation

const getOrderConfirmationArgsRt = rt
  .Record({ companySlug: rt.String, confirmationId: rt.String })
  .asReadonly();

/**
 * operation ID: getOrderConfirmation
 * `GET:
 * /companies/{companySlug}/orderConfirmations/{confirmationId}`
 * Returns order confirmation with specified id.
 */
export const getOrderConfirmation = buildCall() //
  .args<rt.Static<typeof getOrderConfirmationArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/orderConfirmations/${args.confirmationId}`,
  )
  .parseJson(withRuntype(orderConfirmationSchemaRt))
  .build();

// Operation: getOrderConfirmationDrafts

const getOrderConfirmationDraftsArgsRt = rt.Intersect(
  rt.Record({ companySlug: rt.String }).asReadonly(),
  rt.Record({ page: rt.Number, pageSize: rt.Number }).asPartial().asReadonly(),
);

const getOrderConfirmationDraftsResponseBodyRt = rt.Array(
  invoiceishDraftResultSchemaRt,
);

/**
 * operation ID: getOrderConfirmationDrafts
 * `GET: /companies/{companySlug}/orderConfirmations/drafts`
 * Returns all order confirmation drafts for given company.
 */
export const getOrderConfirmationDrafts = buildCall() //
  .args<rt.Static<typeof getOrderConfirmationDraftsArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/orderConfirmations/drafts`)
  .query(
    (args) => new URLSearchParams(pickQueryValues(args, 'page', 'pageSize')),
  )
  .parseJson(withRuntype(getOrderConfirmationDraftsResponseBodyRt))
  .build();

// Operation: createOrderConfirmationDraft

const createOrderConfirmationDraftArgsRt = rt
  .Record({
    companySlug: rt.String,
    requestBody: invoiceishDraftRequestSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: createOrderConfirmationDraft
 * `POST: /companies/{companySlug}/orderConfirmations/drafts`
 * Creates an order confirmation draft.
 */
export const createOrderConfirmationDraft = buildCall() //
  .args<rt.Static<typeof createOrderConfirmationDraftArgsRt>>()
  .method('post')
  .path((args) => `/companies/${args.companySlug}/orderConfirmations/drafts`)
  .body((args) => args.requestBody)
  .build();

// Operation: getOrderConfirmationDraft

const getOrderConfirmationDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: getOrderConfirmationDraft
 * `GET:
 * /companies/{companySlug}/orderConfirmations/drafts/{draftId}`
 * Returns order confirmation draft with specified id.
 */
export const getOrderConfirmationDraft = buildCall() //
  .args<rt.Static<typeof getOrderConfirmationDraftArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/orderConfirmations/drafts/${args.draftId}`,
  )
  .parseJson(withRuntype(invoiceishDraftResultSchemaRt))
  .build();

// Operation: updateOrderConfirmationDraft

const updateOrderConfirmationDraftArgsRt = rt
  .Record({
    companySlug: rt.String,
    draftId: rt.Number,
    requestBody: invoiceishDraftRequestSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: updateOrderConfirmationDraft
 * `PUT:
 * /companies/{companySlug}/orderConfirmations/drafts/{draftId}`
 * Updates order confirmation draft with provided id.
 */
export const updateOrderConfirmationDraft = buildCall() //
  .args<rt.Static<typeof updateOrderConfirmationDraftArgsRt>>()
  .method('put')
  .path(
    (args) =>
      `/companies/${args.companySlug}/orderConfirmations/drafts/${args.draftId}`,
  )
  .body((args) => args.requestBody)
  .build();

// Operation: deleteOrderConfirmationDraft

const deleteOrderConfirmationDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: deleteOrderConfirmationDraft
 * `DELETE:
 * /companies/{companySlug}/orderConfirmations/drafts/{draftId}`
 * Delete order confirmation draft with specified id.
 */
export const deleteOrderConfirmationDraft = buildCall() //
  .args<rt.Static<typeof deleteOrderConfirmationDraftArgsRt>>()
  .method('delete')
  .path(
    (args) =>
      `/companies/${args.companySlug}/orderConfirmations/drafts/${args.draftId}`,
  )
  .build();

// Operation: getOrderConfirmationDraftAttachments

const getOrderConfirmationDraftAttachmentsArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

const getOrderConfirmationDraftAttachmentsResponseBodyRt =
  rt.Array(attachmentSchemaRt);

/**
 * operation ID: getOrderConfirmationDraftAttachments
 * `GET:
 * /companies/{companySlug}/orderConfirmations/drafts/{draftId}/attachments`
 * Returns all attachments for specified draft.
 */
export const getOrderConfirmationDraftAttachments = buildCall() //
  .args<rt.Static<typeof getOrderConfirmationDraftAttachmentsArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/orderConfirmations/drafts/${args.draftId}/attachments`,
  )
  .parseJson(withRuntype(getOrderConfirmationDraftAttachmentsResponseBodyRt))
  .build();

// Operation: addAttachmentToOrderConfirmationDraft

const addAttachmentToOrderConfirmationDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: addAttachmentToOrderConfirmationDraft
 * `POST:
 * /companies/{companySlug}/orderConfirmations/drafts/{draftId}/attachments`
 * Creates and adds a new attachment to an order confirmation
 * draft
 */
export const addAttachmentToOrderConfirmationDraft = buildCall() //
  .args<rt.Static<typeof addAttachmentToOrderConfirmationDraftArgsRt>>()
  .method('post')
  .path(
    (args) =>
      `/companies/${args.companySlug}/orderConfirmations/drafts/${args.draftId}/attachments`,
  )
  .build();

// Operation: createOrderConfirmationFromDraft

const createOrderConfirmationFromDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: createOrderConfirmationFromDraft
 * `POST:
 * /companies/{companySlug}/orderConfirmations/drafts/{draftId}/createOrderConfirmation`
 * Creates an order confirmation from an already created draft.
 */
export const createOrderConfirmationFromDraft = buildCall() //
  .args<rt.Static<typeof createOrderConfirmationFromDraftArgsRt>>()
  .method('post')
  .path(
    (args) =>
      `/companies/${args.companySlug}/orderConfirmations/drafts/${args.draftId}/createOrderConfirmation`,
  )
  .build();

// Operation: getProducts

const getProductsArgsRt = rt.Intersect(
  rt.Record({ companySlug: rt.String }).asReadonly(),
  rt
    .Record({
      page: rt.Number,
      pageSize: rt.Number,
      createdDate: rt.String,
      lastModified: rt.String,
      name: rt.String,
      productNumber: rt.String,
      active: rt.Boolean,
    })
    .asPartial()
    .asReadonly(),
);

const getProductsResponseBodyRt = rt.Array(productSchemaRt);

/**
 * operation ID: getProducts
 * `GET: /companies/{companySlug}/products`
 * Returns all products for given company
 */
export const getProducts = buildCall() //
  .args<rt.Static<typeof getProductsArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/products`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'page',
          'pageSize',
          'createdDate',
          'lastModified',
          'name',
          'productNumber',
          'active',
        ),
      ),
  )
  .parseJson(withRuntype(getProductsResponseBodyRt))
  .build();

// Operation: createProduct

const createProductArgsRt = rt
  .Record({ companySlug: rt.String, requestBody: productSchemaRt })
  .asReadonly();

/**
 * operation ID: createProduct
 * `POST: /companies/{companySlug}/products`
 * Creates a new product.
 */
export const createProduct = buildCall() //
  .args<rt.Static<typeof createProductArgsRt>>()
  .method('post')
  .path((args) => `/companies/${args.companySlug}/products`)
  .body((args) => args.requestBody)
  .build();

// Operation: getProduct

const getProductArgsRt = rt
  .Record({ companySlug: rt.String, productId: rt.Number })
  .asReadonly();

/**
 * operation ID: getProduct
 * `GET: /companies/{companySlug}/products/{productId}`
 * Returns product with specified id.
 */
export const getProduct = buildCall() //
  .args<rt.Static<typeof getProductArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/products/${args.productId}`)
  .parseJson(withRuntype(productSchemaRt))
  .build();

// Operation: updateProduct

const updateProductArgsRt = rt
  .Record({
    companySlug: rt.String,
    productId: rt.Number,
    requestBody: productSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: updateProduct
 * `PUT: /companies/{companySlug}/products/{productId}`
 * Updates an existing product.
 */
export const updateProduct = buildCall() //
  .args<rt.Static<typeof updateProductArgsRt>>()
  .method('put')
  .path((args) => `/companies/${args.companySlug}/products/${args.productId}`)
  .body((args) => args.requestBody)
  .build();

// Operation: deleteProduct

const deleteProductArgsRt = rt
  .Record({ companySlug: rt.String, productId: rt.Number })
  .asReadonly();

/**
 * operation ID: deleteProduct
 * `DELETE: /companies/{companySlug}/products/{productId}`
 * Delete product with specified id.
 */
export const deleteProduct = buildCall() //
  .args<rt.Static<typeof deleteProductArgsRt>>()
  .method('delete')
  .path((args) => `/companies/${args.companySlug}/products/${args.productId}`)
  .build();

// Operation: getSales

const getSalesArgsRt = rt.Intersect(
  rt.Record({ companySlug: rt.String }).asReadonly(),
  rt
    .Record({
      page: rt.Number,
      pageSize: rt.Number,
      lastModified: rt.String,
      lastModifiedLe: rt.String,
      lastModifiedLt: rt.String,
      lastModifiedGe: rt.String,
      lastModifiedGt: rt.String,
      saleNumber: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

const getSalesResponseBodyRt = rt.Array(saleResultSchemaRt);

/**
 * operation ID: getSales
 * `GET: /companies/{companySlug}/sales`
 * Returns all sales for given company
 */
export const getSales = buildCall() //
  .args<rt.Static<typeof getSalesArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/sales`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(
          args,
          'page',
          'pageSize',
          'lastModified',
          'lastModifiedLe',
          'lastModifiedLt',
          'lastModifiedGe',
          'lastModifiedGt',
          'saleNumber',
        ),
      ),
  )
  .parseJson(withRuntype(getSalesResponseBodyRt))
  .build();

// Operation: createSale

const createSaleArgsRt = rt
  .Record({ companySlug: rt.String, requestBody: saleRequestSchemaRt })
  .asReadonly();

/**
 * operation ID: createSale
 * `POST: /companies/{companySlug}/sales`
 * Creates a new sale.
 */
export const createSale = buildCall() //
  .args<rt.Static<typeof createSaleArgsRt>>()
  .method('post')
  .path((args) => `/companies/${args.companySlug}/sales`)
  .body((args) => args.requestBody)
  .build();

// Operation: getSale

const getSaleArgsRt = rt
  .Record({ companySlug: rt.String, saleId: rt.Number })
  .asReadonly();

/**
 * operation ID: getSale
 * `GET: /companies/{companySlug}/sales/{saleId}`
 * Returns sale with specified id.
 */
export const getSale = buildCall() //
  .args<rt.Static<typeof getSaleArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/sales/${args.saleId}`)
  .parseJson(withRuntype(saleResultSchemaRt))
  .build();

// Operation: deleteSale

const deleteSaleArgsRt = rt
  .Record({ companySlug: rt.String, saleId: rt.Number, description: rt.String })
  .asReadonly();

/**
 * operation ID: deleteSale
 * `PATCH: /companies/{companySlug}/sales/{saleId}/delete`
 * Sets the deleted flag for a sale. The sale is not deleted,
 * but a reverse transaction is created and the "deleted"
 * property is set to true.
 */
export const deleteSale = buildCall() //
  .args<rt.Static<typeof deleteSaleArgsRt>>()
  .method('patch')
  .path((args) => `/companies/${args.companySlug}/sales/${args.saleId}/delete`)
  .query((args) => new URLSearchParams(pickQueryValues(args, 'description')))
  .parseJson(withRuntype(saleResultSchemaRt))
  .build();

// Operation: getSaleAttachments

const getSaleAttachmentsArgsRt = rt
  .Record({ companySlug: rt.String, saleId: rt.Number })
  .asReadonly();

const getSaleAttachmentsResponseBodyRt = rt.Array(attachmentSchemaRt);

/**
 * operation ID: getSaleAttachments
 * `GET: /companies/{companySlug}/sales/{saleId}/attachments`
 * Returns all attachments for specified sale.
 */
export const getSaleAttachments = buildCall() //
  .args<rt.Static<typeof getSaleAttachmentsArgsRt>>()
  .method('get')
  .path(
    (args) => `/companies/${args.companySlug}/sales/${args.saleId}/attachments`,
  )
  .parseJson(withRuntype(getSaleAttachmentsResponseBodyRt))
  .build();

// Operation: addAttachmentToSale

const addAttachmentToSaleArgsRt = rt
  .Record({ companySlug: rt.String, saleId: rt.Number })
  .asReadonly();

/**
 * operation ID: addAttachmentToSale
 * `POST: /companies/{companySlug}/sales/{saleId}/attachments`
 * Creates and adds a new attachment to a Sale
 */
export const addAttachmentToSale = buildCall() //
  .args<rt.Static<typeof addAttachmentToSaleArgsRt>>()
  .method('post')
  .path(
    (args) => `/companies/${args.companySlug}/sales/${args.saleId}/attachments`,
  )
  .build();

// Operation: getSalePayments

const getSalePaymentsArgsRt = rt
  .Record({ companySlug: rt.String, saleId: rt.Number })
  .asReadonly();

const getSalePaymentsResponseBodyRt = rt.Array(paymentSchemaRt);

/**
 * operation ID: getSalePayments
 * `GET: /companies/{companySlug}/sales/{saleId}/payments`
 * Returns all payments for given sale
 */
export const getSalePayments = buildCall() //
  .args<rt.Static<typeof getSalePaymentsArgsRt>>()
  .method('get')
  .path(
    (args) => `/companies/${args.companySlug}/sales/${args.saleId}/payments`,
  )
  .parseJson(withRuntype(getSalePaymentsResponseBodyRt))
  .build();

// Operation: createSalePayment

const createSalePaymentArgsRt = rt
  .Record({
    companySlug: rt.String,
    saleId: rt.Number,
    requestBody: paymentSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: createSalePayment
 * `POST: /companies/{companySlug}/sales/{saleId}/payments`
 * Creates a new payment for a given sale.
 */
export const createSalePayment = buildCall() //
  .args<rt.Static<typeof createSalePaymentArgsRt>>()
  .method('post')
  .path(
    (args) => `/companies/${args.companySlug}/sales/${args.saleId}/payments`,
  )
  .body((args) => args.requestBody)
  .build();

// Operation: getSalePayment

const getSalePaymentArgsRt = rt
  .Record({ companySlug: rt.String, saleId: rt.Number, paymentId: rt.Number })
  .asReadonly();

/**
 * operation ID: getSalePayment
 * `GET:
 * /companies/{companySlug}/sales/{saleId}/payments/{paymentId}`
 * Returns payment with specified id.
 */
export const getSalePayment = buildCall() //
  .args<rt.Static<typeof getSalePaymentArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/sales/${args.saleId}/payments/${args.paymentId}`,
  )
  .parseJson(withRuntype(paymentSchemaRt))
  .build();

// Operation: getSaleDrafts

const getSaleDraftsArgsRt = rt.Intersect(
  rt.Record({ companySlug: rt.String }).asReadonly(),
  rt.Record({ page: rt.Number, pageSize: rt.Number }).asPartial().asReadonly(),
);

const getSaleDraftsResponseBodyRt = rt.Array(draftResultSchemaRt);

/**
 * operation ID: getSaleDrafts
 * `GET: /companies/{companySlug}/sales/drafts`
 * Returns all sale drafts for given company.
 */
export const getSaleDrafts = buildCall() //
  .args<rt.Static<typeof getSaleDraftsArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/sales/drafts`)
  .query(
    (args) => new URLSearchParams(pickQueryValues(args, 'page', 'pageSize')),
  )
  .parseJson(withRuntype(getSaleDraftsResponseBodyRt))
  .build();

// Operation: createSaleDraft

const createSaleDraftArgsRt = rt
  .Record({ companySlug: rt.String, requestBody: draftRequestSchemaRt })
  .asReadonly();

/**
 * operation ID: createSaleDraft
 * `POST: /companies/{companySlug}/sales/drafts`
 * Creates a sale draft.
 */
export const createSaleDraft = buildCall() //
  .args<rt.Static<typeof createSaleDraftArgsRt>>()
  .method('post')
  .path((args) => `/companies/${args.companySlug}/sales/drafts`)
  .body((args) => args.requestBody)
  .build();

// Operation: getSaleDraft

const getSaleDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: getSaleDraft
 * `GET: /companies/{companySlug}/sales/drafts/{draftId}`
 * Returns draft with specified id.
 */
export const getSaleDraft = buildCall() //
  .args<rt.Static<typeof getSaleDraftArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/sales/drafts/${args.draftId}`)
  .parseJson(withRuntype(draftResultSchemaRt))
  .build();

// Operation: updateSaleDraft

const updateSaleDraftArgsRt = rt
  .Record({
    companySlug: rt.String,
    draftId: rt.Number,
    requestBody: draftRequestSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: updateSaleDraft
 * `PUT: /companies/{companySlug}/sales/drafts/{draftId}`
 * Updates draft with provided id.
 */
export const updateSaleDraft = buildCall() //
  .args<rt.Static<typeof updateSaleDraftArgsRt>>()
  .method('put')
  .path((args) => `/companies/${args.companySlug}/sales/drafts/${args.draftId}`)
  .body((args) => args.requestBody)
  .build();

// Operation: deleteSaleDraft

const deleteSaleDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: deleteSaleDraft
 * `DELETE: /companies/{companySlug}/sales/drafts/{draftId}`
 * Delete draft with specified id.
 */
export const deleteSaleDraft = buildCall() //
  .args<rt.Static<typeof deleteSaleDraftArgsRt>>()
  .method('delete')
  .path((args) => `/companies/${args.companySlug}/sales/drafts/${args.draftId}`)
  .build();

// Operation: getSaleDraftAttachments

const getSaleDraftAttachmentsArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

const getSaleDraftAttachmentsResponseBodyRt = rt.Array(attachmentSchemaRt);

/**
 * operation ID: getSaleDraftAttachments
 * `GET:
 * /companies/{companySlug}/sales/drafts/{draftId}/attachments`
 * Returns all attachments for specified draft.
 */
export const getSaleDraftAttachments = buildCall() //
  .args<rt.Static<typeof getSaleDraftAttachmentsArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/sales/drafts/${args.draftId}/attachments`,
  )
  .parseJson(withRuntype(getSaleDraftAttachmentsResponseBodyRt))
  .build();

// Operation: addAttachmentToSaleDraft

const addAttachmentToSaleDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: addAttachmentToSaleDraft
 * `POST:
 * /companies/{companySlug}/sales/drafts/{draftId}/attachments`
 * Creates and adds a new attachment to a draft
 */
export const addAttachmentToSaleDraft = buildCall() //
  .args<rt.Static<typeof addAttachmentToSaleDraftArgsRt>>()
  .method('post')
  .path(
    (args) =>
      `/companies/${args.companySlug}/sales/drafts/${args.draftId}/attachments`,
  )
  .build();

// Operation: createSaleFromDraft

const createSaleFromDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: createSaleFromDraft
 * `POST:
 * /companies/{companySlug}/sales/drafts/{draftId}/createSale`
 * Creates a sale from an already created draft.
 */
export const createSaleFromDraft = buildCall() //
  .args<rt.Static<typeof createSaleFromDraftArgsRt>>()
  .method('post')
  .path(
    (args) =>
      `/companies/${args.companySlug}/sales/drafts/${args.draftId}/createSale`,
  )
  .build();

// Operation: getPurchases

const getPurchasesArgsRt = rt.Intersect(
  rt.Record({ companySlug: rt.String }).asReadonly(),
  rt
    .Record({
      page: rt.Number,
      pageSize: rt.Number,
      sortBy: rt.Union(rt.Literal('date asc'), rt.Literal('date desc')),
    })
    .asPartial()
    .asReadonly(),
);

const getPurchasesResponseBodyRt = rt.Array(purchaseResultSchemaRt);

/**
 * operation ID: getPurchases
 * `GET: /companies/{companySlug}/purchases`
 * Returns all purchases for given company
 */
export const getPurchases = buildCall() //
  .args<rt.Static<typeof getPurchasesArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/purchases`)
  .query(
    (args) =>
      new URLSearchParams(pickQueryValues(args, 'page', 'pageSize', 'sortBy')),
  )
  .parseJson(withRuntype(getPurchasesResponseBodyRt))
  .build();

// Operation: createPurchase

const createPurchaseArgsRt = rt
  .Record({ companySlug: rt.String, requestBody: purchaseRequestSchemaRt })
  .asReadonly();

/**
 * operation ID: createPurchase
 * `POST: /companies/{companySlug}/purchases`
 * Creates a new purchase.
 */
export const createPurchase = buildCall() //
  .args<rt.Static<typeof createPurchaseArgsRt>>()
  .method('post')
  .path((args) => `/companies/${args.companySlug}/purchases`)
  .body((args) => args.requestBody)
  .build();

// Operation: getPurchase

const getPurchaseArgsRt = rt
  .Record({ companySlug: rt.String, purchaseId: rt.Number })
  .asReadonly();

/**
 * operation ID: getPurchase
 * `GET: /companies/{companySlug}/purchases/{purchaseId}`
 * Returns purchase with specified id.
 */
export const getPurchase = buildCall() //
  .args<rt.Static<typeof getPurchaseArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/purchases/${args.purchaseId}`)
  .parseJson(withRuntype(purchaseResultSchemaRt))
  .build();

// Operation: deletePurchase

const deletePurchaseArgsRt = rt
  .Record({
    companySlug: rt.String,
    purchaseId: rt.Number,
    description: rt.String,
  })
  .asReadonly();

/**
 * operation ID: deletePurchase
 * `PATCH:
 * /companies/{companySlug}/purchases/{purchaseId}/delete`
 * Sets the deleted flag for a purchase. The purchase is not
 * deleted, but a reverse transaction is created and the
 * "deleted" property is set to true.
 */
export const deletePurchase = buildCall() //
  .args<rt.Static<typeof deletePurchaseArgsRt>>()
  .method('patch')
  .path(
    (args) =>
      `/companies/${args.companySlug}/purchases/${args.purchaseId}/delete`,
  )
  .query((args) => new URLSearchParams(pickQueryValues(args, 'description')))
  .parseJson(withRuntype(purchaseResultSchemaRt))
  .build();

// Operation: getPurchaseAttachments

const getPurchaseAttachmentsArgsRt = rt
  .Record({ companySlug: rt.String, purchaseId: rt.Number })
  .asReadonly();

const getPurchaseAttachmentsResponseBodyRt = rt.Array(attachmentSchemaRt);

/**
 * operation ID: getPurchaseAttachments
 * `GET:
 * /companies/{companySlug}/purchases/{purchaseId}/attachments`
 * Returns all attachments for specified purchase.
 */
export const getPurchaseAttachments = buildCall() //
  .args<rt.Static<typeof getPurchaseAttachmentsArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/purchases/${args.purchaseId}/attachments`,
  )
  .parseJson(withRuntype(getPurchaseAttachmentsResponseBodyRt))
  .build();

// Operation: addAttachmentToPurchase

const addAttachmentToPurchaseArgsRt = rt
  .Record({ companySlug: rt.String, purchaseId: rt.Number })
  .asReadonly();

/**
 * operation ID: addAttachmentToPurchase
 * `POST:
 * /companies/{companySlug}/purchases/{purchaseId}/attachments`
 * Creates and adds a new attachment to a Purchase
 */
export const addAttachmentToPurchase = buildCall() //
  .args<rt.Static<typeof addAttachmentToPurchaseArgsRt>>()
  .method('post')
  .path(
    (args) =>
      `/companies/${args.companySlug}/purchases/${args.purchaseId}/attachments`,
  )
  .build();

// Operation: getPurchasePayments

const getPurchasePaymentsArgsRt = rt
  .Record({ companySlug: rt.String, purchaseId: rt.Number })
  .asReadonly();

const getPurchasePaymentsResponseBodyRt = rt.Array(paymentSchemaRt);

/**
 * operation ID: getPurchasePayments
 * `GET:
 * /companies/{companySlug}/purchases/{purchaseId}/payments`
 * Returns all purchases for given company
 */
export const getPurchasePayments = buildCall() //
  .args<rt.Static<typeof getPurchasePaymentsArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/purchases/${args.purchaseId}/payments`,
  )
  .parseJson(withRuntype(getPurchasePaymentsResponseBodyRt))
  .build();

// Operation: createPurchasePayment

const createPurchasePaymentArgsRt = rt
  .Record({
    companySlug: rt.String,
    purchaseId: rt.Number,
    requestBody: paymentSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: createPurchasePayment
 * `POST:
 * /companies/{companySlug}/purchases/{purchaseId}/payments`
 * Creates a new payment for a purchase
 */
export const createPurchasePayment = buildCall() //
  .args<rt.Static<typeof createPurchasePaymentArgsRt>>()
  .method('post')
  .path(
    (args) =>
      `/companies/${args.companySlug}/purchases/${args.purchaseId}/payments`,
  )
  .body((args) => args.requestBody)
  .build();

// Operation: getPurchasePayment

const getPurchasePaymentArgsRt = rt
  .Record({
    companySlug: rt.String,
    purchaseId: rt.Number,
    paymentId: rt.Number,
  })
  .asReadonly();

/**
 * operation ID: getPurchasePayment
 * `GET:
 * /companies/{companySlug}/purchases/{purchaseId}/payments/{paymentId}`
 * Returns given payment for specified purchase
 */
export const getPurchasePayment = buildCall() //
  .args<rt.Static<typeof getPurchasePaymentArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/purchases/${args.purchaseId}/payments/${args.paymentId}`,
  )
  .parseJson(withRuntype(paymentSchemaRt))
  .build();

// Operation: getPurchaseDrafts

const getPurchaseDraftsArgsRt = rt.Intersect(
  rt.Record({ companySlug: rt.String }).asReadonly(),
  rt.Record({ page: rt.Number, pageSize: rt.Number }).asPartial().asReadonly(),
);

const getPurchaseDraftsResponseBodyRt = rt.Array(draftResultSchemaRt);

/**
 * operation ID: getPurchaseDrafts
 * `GET: /companies/{companySlug}/purchases/drafts`
 * Returns all purchase drafts for given company.
 */
export const getPurchaseDrafts = buildCall() //
  .args<rt.Static<typeof getPurchaseDraftsArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/purchases/drafts`)
  .query(
    (args) => new URLSearchParams(pickQueryValues(args, 'page', 'pageSize')),
  )
  .parseJson(withRuntype(getPurchaseDraftsResponseBodyRt))
  .build();

// Operation: createPurchaseDraft

const createPurchaseDraftArgsRt = rt
  .Record({ companySlug: rt.String, requestBody: draftRequestSchemaRt })
  .asReadonly();

/**
 * operation ID: createPurchaseDraft
 * `POST: /companies/{companySlug}/purchases/drafts`
 * Creates a purchase draft.
 */
export const createPurchaseDraft = buildCall() //
  .args<rt.Static<typeof createPurchaseDraftArgsRt>>()
  .method('post')
  .path((args) => `/companies/${args.companySlug}/purchases/drafts`)
  .body((args) => args.requestBody)
  .build();

// Operation: getPurchaseDraft

const getPurchaseDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: getPurchaseDraft
 * `GET: /companies/{companySlug}/purchases/drafts/{draftId}`
 * Returns draft with specified id.
 */
export const getPurchaseDraft = buildCall() //
  .args<rt.Static<typeof getPurchaseDraftArgsRt>>()
  .method('get')
  .path(
    (args) => `/companies/${args.companySlug}/purchases/drafts/${args.draftId}`,
  )
  .parseJson(withRuntype(draftResultSchemaRt))
  .build();

// Operation: updatePurchaseDraft

const updatePurchaseDraftArgsRt = rt
  .Record({
    companySlug: rt.String,
    draftId: rt.Number,
    requestBody: draftRequestSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: updatePurchaseDraft
 * `PUT: /companies/{companySlug}/purchases/drafts/{draftId}`
 * Updates draft with provided id.
 */
export const updatePurchaseDraft = buildCall() //
  .args<rt.Static<typeof updatePurchaseDraftArgsRt>>()
  .method('put')
  .path(
    (args) => `/companies/${args.companySlug}/purchases/drafts/${args.draftId}`,
  )
  .body((args) => args.requestBody)
  .build();

// Operation: deletePurchaseDraft

const deletePurchaseDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: deletePurchaseDraft
 * `DELETE:
 * /companies/{companySlug}/purchases/drafts/{draftId}`
 * Delete draft with specified id.
 */
export const deletePurchaseDraft = buildCall() //
  .args<rt.Static<typeof deletePurchaseDraftArgsRt>>()
  .method('delete')
  .path(
    (args) => `/companies/${args.companySlug}/purchases/drafts/${args.draftId}`,
  )
  .build();

// Operation: getPurchaseDraftAttachments

const getPurchaseDraftAttachmentsArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

const getPurchaseDraftAttachmentsResponseBodyRt = rt.Array(attachmentSchemaRt);

/**
 * operation ID: getPurchaseDraftAttachments
 * `GET:
 * /companies/{companySlug}/purchases/drafts/{draftId}/attachments`
 * Returns all attachments for specified draft.
 */
export const getPurchaseDraftAttachments = buildCall() //
  .args<rt.Static<typeof getPurchaseDraftAttachmentsArgsRt>>()
  .method('get')
  .path(
    (args) =>
      `/companies/${args.companySlug}/purchases/drafts/${args.draftId}/attachments`,
  )
  .parseJson(withRuntype(getPurchaseDraftAttachmentsResponseBodyRt))
  .build();

// Operation: addAttachmentToPurchaseDraft

const addAttachmentToPurchaseDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: addAttachmentToPurchaseDraft
 * `POST:
 * /companies/{companySlug}/purchases/drafts/{draftId}/attachments`
 * Creates and adds a new attachment to a draft
 */
export const addAttachmentToPurchaseDraft = buildCall() //
  .args<rt.Static<typeof addAttachmentToPurchaseDraftArgsRt>>()
  .method('post')
  .path(
    (args) =>
      `/companies/${args.companySlug}/purchases/drafts/${args.draftId}/attachments`,
  )
  .build();

// Operation: createPurchaseFromDraft

const createPurchaseFromDraftArgsRt = rt
  .Record({ companySlug: rt.String, draftId: rt.Number })
  .asReadonly();

/**
 * operation ID: createPurchaseFromDraft
 * `POST:
 * /companies/{companySlug}/purchases/drafts/{draftId}/createPurchase`
 * Creates a purchase from an already created draft.
 */
export const createPurchaseFromDraft = buildCall() //
  .args<rt.Static<typeof createPurchaseFromDraftArgsRt>>()
  .method('post')
  .path(
    (args) =>
      `/companies/${args.companySlug}/purchases/drafts/${args.draftId}/createPurchase`,
  )
  .build();

// Operation: getInbox

const getInboxArgsRt = rt.Intersect(
  rt.Record({ companySlug: rt.String }).asReadonly(),
  rt
    .Record({
      page: rt.Number,
      pageSize: rt.Number,
      sortBy: rt.Union(
        rt.Literal('createdDate asc'),
        rt.Literal('createdDate desc'),
        rt.Literal('name asc'),
        rt.Literal('name desc'),
      ),
      status: rt.Union(
        rt.Literal('all'),
        rt.Literal('unused'),
        rt.Literal('used'),
      ),
      name: rt.String,
    })
    .asPartial()
    .asReadonly(),
);

const getInboxResponseBodyRt = rt.Array(inboxResultSchemaRt);

/**
 * operation ID: getInbox
 * `GET: /companies/{companySlug}/inbox`
 * Returns the contents of the inbox for given company.
 */
export const getInbox = buildCall() //
  .args<rt.Static<typeof getInboxArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/inbox`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'page', 'pageSize', 'sortBy', 'status', 'name'),
      ),
  )
  .parseJson(withRuntype(getInboxResponseBodyRt))
  .build();

// Operation: createInboxDocument

const createInboxDocumentArgsRt = rt
  .Record({ companySlug: rt.String })
  .asReadonly();

/**
 * operation ID: createInboxDocument
 * `POST: /companies/{companySlug}/inbox`
 * Upload a document to the inbox
 */
export const createInboxDocument = buildCall() //
  .args<rt.Static<typeof createInboxDocumentArgsRt>>()
  .method('post')
  .path((args) => `/companies/${args.companySlug}/inbox`)
  .build();

// Operation: getInboxDocument

const getInboxDocumentArgsRt = rt
  .Record({ companySlug: rt.String, inboxDocumentId: rt.Number })
  .asReadonly();

/**
 * operation ID: getInboxDocument
 * `GET: /companies/{companySlug}/inbox/{inboxDocumentId}`
 * Returns the inbox document with specified id
 */
export const getInboxDocument = buildCall() //
  .args<rt.Static<typeof getInboxDocumentArgsRt>>()
  .method('get')
  .path(
    (args) => `/companies/${args.companySlug}/inbox/${args.inboxDocumentId}`,
  )
  .parseJson(withRuntype(inboxResultSchemaRt))
  .build();

// Operation: getProjects

const getProjectsArgsRt = rt.Intersect(
  rt.Record({ companySlug: rt.String }).asReadonly(),
  rt
    .Record({ page: rt.Number, pageSize: rt.Number, completed: rt.Boolean })
    .asPartial()
    .asReadonly(),
);

const getProjectsResponseBodyRt = rt.Array(projectResultSchemaRt);

/**
 * operation ID: getProjects
 * `GET: /companies/{companySlug}/projects`
 * Returns all projects for given company
 */
export const getProjects = buildCall() //
  .args<rt.Static<typeof getProjectsArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/projects`)
  .query(
    (args) =>
      new URLSearchParams(
        pickQueryValues(args, 'page', 'pageSize', 'completed'),
      ),
  )
  .parseJson(withRuntype(getProjectsResponseBodyRt))
  .build();

// Operation: createProject

const createProjectArgsRt = rt
  .Record({ companySlug: rt.String, requestBody: projectRequestSchemaRt })
  .asReadonly();

/**
 * operation ID: createProject
 * `POST: /companies/{companySlug}/projects`
 * Creates a new project
 */
export const createProject = buildCall() //
  .args<rt.Static<typeof createProjectArgsRt>>()
  .method('post')
  .path((args) => `/companies/${args.companySlug}/projects`)
  .body((args) => args.requestBody)
  .build();

// Operation: getProject

const getProjectArgsRt = rt
  .Record({ companySlug: rt.String, projectId: rt.Number })
  .asReadonly();

/**
 * operation ID: getProject
 * `GET: /companies/{companySlug}/projects/{projectId}`
 * Returns project with specified id.
 */
export const getProject = buildCall() //
  .args<rt.Static<typeof getProjectArgsRt>>()
  .method('get')
  .path((args) => `/companies/${args.companySlug}/projects/${args.projectId}`)
  .parseJson(withRuntype(projectResultSchemaRt))
  .build();

// Operation: deleteProject

const deleteProjectArgsRt = rt
  .Record({ companySlug: rt.String, projectId: rt.Number })
  .asReadonly();

/**
 * operation ID: deleteProject
 * `DELETE: /companies/{companySlug}/projects/{projectId}`
 * Delete project with specified id.
 */
export const deleteProject = buildCall() //
  .args<rt.Static<typeof deleteProjectArgsRt>>()
  .method('delete')
  .path((args) => `/companies/${args.companySlug}/projects/${args.projectId}`)
  .build();

// Operation: updateProject

const updateProjectArgsRt = rt
  .Record({
    companySlug: rt.String,
    projectId: rt.Number,
    requestBody: updateProjectRequestSchemaRt,
  })
  .asReadonly();

/**
 * operation ID: updateProject
 * `PATCH: /companies/{companySlug}/projects/{projectId}`
 * Updates project with provided id.
 */
export const updateProject = buildCall() //
  .args<rt.Static<typeof updateProjectArgsRt>>()
  .method('patch')
  .path((args) => `/companies/${args.companySlug}/projects/${args.projectId}`)
  .body((args) => args.requestBody)
  .build();
