FROM postgres:latest

# Copy initialization scripts into the container
COPY ./init.sql /docker-entrypoint-initdb.d/

# Expose PostgreSQL port
EXPOSE 5432
