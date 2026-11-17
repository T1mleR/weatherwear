FROM python:3.12-alpine
WORKDIR /app
COPY oncall.py /app/oncall.py
RUN mkdir -p /data
EXPOSE 8080
CMD ["python", "-u", "/app/oncall.py"]
