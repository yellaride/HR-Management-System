export interface PayslipRecord {
  _id: string;
  employeeId?: { _id?: string; name?: string; jobTitle?: string } | string | null;
  employeeName?: string;
  employeeRole?: string;
  period: string;
  basicSalary: number;
  allowances?: number;
  bonus?: number;
  deductions?: number;
  netPay: number;
  paymentMethod?: string;
  paymentDate?: string;
}

const defaultFormatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    currencyDisplay: "symbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\u0024/g, "");

export async function downloadPayslipPdf({
  slip,
  employeeName,
  employeeRole,
  formatCurrency = defaultFormatCurrency,
}: {
  slip: PayslipRecord;
  employeeName: string;
  employeeRole: string;
  formatCurrency?: (amount: number) => string;
}) {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryColor = [79, 70, 229];
  const darkColor = [15, 23, 42];
  const lightColor = [248, 250, 252];
  const grayColor = [100, 116, 139];
  const borderColor = [226, 232, 240];

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("YOUR COMPANY NAME", 20, 25);

  doc.setFontSize(8.5);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text("123 Corporate Blvd, Suite 100", 20, 31);
  doc.text("hr@yourcompany.com | +1 (555) 019-2834", 20, 36);

  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.5);
  doc.line(20, 42, 190, 42);

  doc.setFontSize(13);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text("OFFICIAL PAYSLIP RECOVERY RECEIPT", 20, 52);

  doc.setFontSize(9);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(`Statement ID: PAY-${slip._id.slice(-6).toUpperCase()}`, 135, 52);
  doc.text(`Period: ${slip.period}`, 135, 57);
  doc.text("Status: PAID", 135, 62);

  doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
  doc.rect(20, 68, 170, 26, "F");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text("EMPLOYEE SUMMARY", 25, 74);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text("Employee Name:", 25, 81);
  doc.text("Role / Position:", 25, 87);
  doc.text("Payment Method:", 110, 81);
  doc.text("Payment Date:", 110, 87);

  doc.setFont("Helvetica", "bold");
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(employeeName, 52, 81);
  doc.text(employeeRole, 52, 87);
  doc.text(slip.paymentMethod || "Bank Transfer", 138, 81);
  doc.text(slip.paymentDate ? new Date(slip.paymentDate).toLocaleDateString() : "N/A", 138, 87);

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(20, 102, 170, 8, "F");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("Description", 25, 107.5);
  doc.text("Earnings", 140, 107.5, { align: "right" });
  doc.text("Deductions", 175, 107.5, { align: "right" });

  let rowY = 117;
  const rowSpacing = 7.5;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

  const addRow = (label: string, earningsVal: number | string, deductionsVal: number | string) => {
    doc.text(label, 25, rowY);
    doc.text(typeof earningsVal === "number" ? formatCurrency(earningsVal) : earningsVal, 140, rowY, { align: "right" });
    doc.text(typeof deductionsVal === "number" ? formatCurrency(deductionsVal) : deductionsVal, 175, rowY, { align: "right" });
    rowY += rowSpacing;
  };

  addRow("Basic Base Salary", slip.basicSalary, "-");

  if ((slip.allowances || 0) > 0) {
    addRow("Standard Allowances", slip.allowances || 0, "-");
  }
  if ((slip.bonus || 0) > 0) {
    addRow("Performance Bonuses", slip.bonus || 0, "-");
  }
  if ((slip.deductions || 0) > 0) {
    addRow("Payroll Deductions / Tax withholdings", "-", slip.deductions || 0);
  }

  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(20, rowY - 2, 190, rowY - 2);
  rowY += 2;

  const grossEarnings = slip.basicSalary + (slip.allowances || 0) + (slip.bonus || 0);
  const grossDeductions = slip.deductions || 0;

  doc.setFont("Helvetica", "bold");
  addRow("Sub-totals:", grossEarnings, grossDeductions);

  rowY += 2;

  doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
  doc.rect(20, rowY, 170, 12, "F");

  doc.setFontSize(10.5);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Net Take-Home Pay (PKR / Rs.)", 25, rowY + 7.5);
  doc.text(formatCurrency(slip.netPay), 175, rowY + 7.5, { align: "right" });

  rowY += 28;

  doc.setFontSize(7.5);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text("Disclaimer: This document is a computer-generated receipt issued in digital format.", 20, rowY);
  doc.text("If you spot anomalies regarding basic calculations, please write to HR within five business days.", 20, rowY + 3.5);

  const cleanFileName = `Payslip_${employeeName.replace(/\s+/g, "_")}_${slip.period.replace(/\s+/g, "_")}.pdf`;
  doc.save(cleanFileName);
}
