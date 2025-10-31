import { storage } from "./storage";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  try {
    // Check if admin user already exists
    const adminUser = await storage.getUserByUsername("Akcent.559");
    
    if (!adminUser) {
      console.log("Creating admin user...");
      
      // Hash the password "Akcent"
      const hashedPassword = await bcrypt.hash("Akcent", 10);
      
      // Create admin user
      await storage.createUser({
        username: "Akcent.559",
        password: hashedPassword,
        role: "admin",
        active: true,
      });
      
      console.log("Admin user created successfully!");
      console.log("Username: Akcent.559");
      console.log("Password: Akcent");
    } else {
      console.log("Admin user already exists");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
