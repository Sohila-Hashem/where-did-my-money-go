
import * as z from "zod";

try {
  // @ts-ignore - simulating the issue where z.iso might not exist or behaves differently
  const schema = z.strictObject({
    date: z.iso.date("Transaction Date is required."),
  });

  const data = {
    date: new Date(),
  };

  const result = schema.safeParse(data);
  console.log("Validation result:", result);
} catch (e) {
  console.log("Error defining schema or validating:", e);
}
