# .ddev/web-build/Dockerfile.example
ARG BASE_IMAGE
FROM $BASE_IMAGE

# Add any needed packages, for example:
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    vis

COPY AllowOverrides.conf /etc/apache2/conf-available/AllowOverrides.conf

#RUN a2enconf AllowOverrides