# دليل نشر EduPath AI على AlwaysData

## الملفات المهمة
- `alwaysdata_wsgi.py`: ملف تشغيل WSGI على AlwaysData.
- `requirements.txt`: لتثبيت مكتبات Python.
- `ALWAYSDATA_ENV_TEMPLATE.txt`: قالب متغيرات البيئة.

## الخطوات المختصرة
1. أنشئ حساب AlwaysData Free.
2. أنشئ PostgreSQL database من Databases > PostgreSQL.
3. ارفع ملفات هذا المشروع إلى مجلد مثل:
   `/home/YOUR_ACCOUNT/www/edupath-ai`
4. أنشئ Python WSGI web app.
5. اجعل WSGI file/application path يشير إلى:
   `/home/YOUR_ACCOUNT/www/edupath-ai/alwaysdata_wsgi.py`
6. افتح SSH/Terminal داخل مجلد المشروع وثبّت المتطلبات:
   `pip install -r requirements.txt`
7. أضف متغيرات البيئة من `ALWAYSDATA_ENV_TEMPLATE.txt`.
8. اضغط Reload/Restart للتطبيق.
9. اختبر التسجيل، الأهداف، المهام، English Coach، Scholarship Coach.

## مهم
- لا تحذف Render + Neon حتى تتأكد أن AlwaysData يعمل 100%.
- في Render استخدم رابط Neon الحالي.
- في AlwaysData استخدم رابط PostgreSQL الخاص بـ AlwaysData.
- لا تضع مفاتيح API أو كلمات مرور داخل ملفات التطبيق.
