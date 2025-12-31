import { eq } from "drizzle-orm";
import { db, whatsappConnection, organization } from "@wp-nps/db";

async function main() {

  const orgs = await db.select().from(organization).limit(5);
  console.log("Organizations:", orgs);

  if (orgs.length === 0) {
    console.log("No organizations found");
    process.exit(0);
  }

  const targetOrg = orgs[0]!;
  console.log(`\nUsing org: ${targetOrg.id} (${targetOrg.name})`);

  const existing = await db
    .select()
    .from(whatsappConnection)
    .where(eq(whatsappConnection.orgId, targetOrg.id));

  console.log("Existing connections:", existing);

  if (existing.length > 0) {
    console.log("\nUpdating existing connection...");
    await db
      .update(whatsappConnection)
      .set({
        status: "active",
        phoneNumber: "+56920403095",
        metadata: {
          phoneNumberId: "597907523413541",
          businessAccountId: "2102230076919824",
          configurationId: "6d4aa231-210d-45ef-97b6-9a319d925f06",
          sandbox: true,
        },
        connectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(whatsappConnection.orgId, targetOrg.id));
  } else {
    console.log("\nCreating new connection...");
    await db.insert(whatsappConnection).values({
      orgId: targetOrg.id,
      status: "active",
      phoneNumber: "+1 555 093 9822",
      kapsoId: "sandbox-connection",
      metadata: {
        phoneNumberId: "597907523413541",
        businessAccountId: "2102230076919824",
        configurationId: "6d4aa231-210d-45ef-97b6-9a319d925f06",
        sandbox: true,
      },
      connectedAt: new Date(),
    });
  }

  const final = await db
    .select()
    .from(whatsappConnection)
    .where(eq(whatsappConnection.orgId, targetOrg.id));

  console.log("\nFinal connection:", final);
  process.exit(0);
}

main().catch(console.error);
