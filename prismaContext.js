const Prisma = require("@qhuynhvhslab/anomura-prisma-package");
require("dotenv").config();

const { prisma } = Prisma.createContext()

exports.prisma = prisma