# syntax=docker/dockerfile:1

# Build arguments
ARG JDK_VERSION=25
ARG LYRA_BACKEND_PORT=8080

# Create a stage for resolving and downloading dependencies.
FROM azul/zulu-openjdk-alpine:${JDK_VERSION}-latest AS deps

WORKDIR /build

# Copy the Gradle wrapper with executable permissions.
COPY --chmod=0755 gradlew ./
COPY gradle gradle/

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.gradle so that subsequent builds don't have to
# re-download packages.
RUN --mount=type=bind,source=build.gradle.kts,target=build.gradle.kts \
    --mount=type=bind,source=settings.gradle.kts,target=settings.gradle.kts \
    --mount=type=cache,target=/root/.gradle \
    ./gradlew build -x test --refresh-dependencies

################################################################################

# Create a stage for building the application based on the stage with downloaded dependencies.
# This Dockerfile is optimized for Java applications that output an uber jar, which includes
# all the dependencies needed to run your app inside a JVM. If your app doesn't output an uber
# jar and instead relies on an application server like Apache Tomcat, you'll need to update this
# stage with the correct filename of your package and update the base image of the "final" stage
# use the relevant app server, e.g., using tomcat (https://hub.docker.com/_/tomcat/) as a base image.
FROM deps AS package

WORKDIR /build

COPY ./src src/
RUN --mount=type=bind,source=build.gradle.kts,target=build.gradle.kts \
    --mount=type=bind,source=settings.gradle.kts,target=settings.gradle.kts \
    --mount=type=bind,source=gradle/libs.versions.toml,target=gradle/libs.versions.toml \
    --mount=type=cache,target=/root/.gradle \
    ./gradlew shadowJar -x test && \
    mv build/libs/backend-*-all.jar build/app.jar


################################################################################

# Create a new stage for running the application that contains the minimal
# runtime dependencies for the application. This often uses a different base
# image from the install or build stage where the necessary files are copied
# from the install stage.

FROM azul/zulu-openjdk-alpine:${JDK_VERSION}-latest AS final

# Create a non-privileged user that the app will run under.
# See https://docs.docker.com/go/dockerfile-user-best-practices/
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/app" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

RUN apk add --no-cache openssh-client

WORKDIR /app
RUN mkdir -p /app/.ssh /app/data /app/lyra-repos && \
    ssh-keyscan github.com >> /app/.ssh/known_hosts && \
    chown -R appuser /app

USER appuser

# Copy the executable from the "package" stage.
COPY --from=package /build/build/app.jar app.jar

EXPOSE $LYRA_BACKEND_PORT

ENV LYRA_BACKEND_PORT=${LYRA_BACKEND_PORT}

ENTRYPOINT [ "java", "--enable-native-access=ALL-UNNAMED", "-jar", "app.jar" ]


