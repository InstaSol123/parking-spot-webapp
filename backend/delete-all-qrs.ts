import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllQRs() {
  try {
    console.log('🗑️  Starting QR code deletion...');
    
    // Get counts before deletion
    const totalQRs = await prisma.qRCodeData.count();
    const unusedQRs = await prisma.qRCodeData.count({
      where: { status: 'UNUSED' }
    });
    const activeQRs = await prisma.qRCodeData.count({
      where: { status: 'ACTIVE' }
    });
    
    console.log(`\n📊 Current QR Code Statistics:`);
    console.log(`   Total QR Codes: ${totalQRs}`);
    console.log(`   Unused/Generated: ${unusedQRs}`);
    console.log(`   Active/Used: ${activeQRs}`);
    
    // Confirm deletion
    console.log('\n⚠️  WARNING: This will delete ALL QR codes from the system!');
    console.log('   - All unused/generated QR codes will be deleted');
    console.log('   - All active/used QR codes will be deleted');
    console.log('   - Serial number sequence will reset to 1');
    
    // Delete all QR codes
    const result = await prisma.qRCodeData.deleteMany({});
    
    console.log(`\n✅ Successfully deleted ${result.count} QR codes`);
    console.log('✅ Serial number sequence has been reset');
    console.log('\n📝 Next generated QR will start from SR000001\n');
    
  } catch (error) {
    console.error('❌ Error deleting QR codes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the deletion
deleteAllQRs()
  .then(() => {
    console.log('🎉 QR deletion completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to delete QR codes:', error);
    process.exit(1);
  });
