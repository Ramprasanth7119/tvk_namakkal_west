import clientPromise from "../lib/mongodb";

async function main() {
  try {
    const client = await clientPromise;
    const db = client.db('tvk-west');
    const voters = await db.collection('voterRegistry').find({}).toArray();
    console.log("All Voter Documents in 'tvk-west':", JSON.stringify(voters, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
