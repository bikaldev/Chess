# Use the official Nginx image as a base
FROM nginx:alpine

# Copy the build files to Nginx's default directory
COPY build /usr/share/nginx/html

# Copy your custom Nginx configuration
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port Nginx will serve on
EXPOSE 3000