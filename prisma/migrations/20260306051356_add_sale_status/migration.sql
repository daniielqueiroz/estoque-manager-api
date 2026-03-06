/*
  Warnings:

  - Added the required column `updatedAt` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Sale` ADD COLUMN `status` ENUM('CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
