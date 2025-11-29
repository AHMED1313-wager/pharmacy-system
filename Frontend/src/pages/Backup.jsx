import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';

const Backup = () => {
  const handleBackup = () => {
    alert('تم إنشاء نسخة احتياطية (مثال فقط)');
    // ربط آلية النسخ الاحتياطي الفعلية مع قاعدة البيانات أو السيرفر هنا
  };

  const handleRestore = () => {
    alert('تم استعادة النسخة الاحتياطية (مثال فقط)');
    // ربط آلية الاستعادة الفعلية مع قاعدة البيانات أو السيرفر هنا
  };

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={4}>
        النسخ الاحتياطي واستعادة البيانات
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
        <Button variant="contained" color="primary" size="large" onClick={handleBackup}>
          إنشاء نسخة احتياطية
        </Button>
        <Button variant="outlined" color="secondary" size="large" onClick={handleRestore}>
          استعادة النسخة الاحتياطية
        </Button>
      </Stack>
    </Box>
  );
};

export default Backup;