import bcrypt from "bcryptjs";

// Mongoose used a pre-save hook for this; with Prisma the hashing is explicit.
export const hashPassword = async (plainPassword: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

export const matchPassword = (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => bcrypt.compare(plainPassword, hashedPassword);
