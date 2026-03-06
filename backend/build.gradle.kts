plugins {
    kotlin("jvm") version libs.versions.kotlin
    kotlin("plugin.serialization") version libs.versions.kotlinSerialization
    application
    id("com.gradleup.shadow") version "8.3.8"
    id("org.openapi.generator") version "7.14.0"
}

val jdkVersion = "25"

group = "org.zetkin.lyra.backend"
version = "0.9.0"

repositories {
    mavenCentral()
}

application {
    // Entry point for the application
    mainClass.set("org.zetkin.lyra.backend.ApplicationKt")
    applicationDefaultJvmArgs = listOf("--enable-native-access=ALL-UNNAMED")
}

dependencies {
    // Koin BOM (Bill of Materials) - manages all Koin dependency versions
    implementation(platform(libs.koin.bom))

    // ktor as the rest-api framework
    implementation(libs.ktor.client.core)
    implementation(libs.ktor.server.netty)
    implementation(libs.ktor.server.cors.jvm)
    // The SQLite Driver
    implementation(libs.sqlite.jdbc)

    // Flyway for running migrations within src/main/resources/db/migrations
    implementation(libs.flyway.core)

    // JetBrains Exposed for writing Kotlin queries later
    implementation(libs.bundles.exposed)

    // Koin for Dependency Injection
    implementation(libs.bundles.koin)

    // Ktor Content Negotiation & JSON Serialization
    implementation(libs.bundles.ktor)

    // JGit for using git commands
    implementation(libs.jgit)
    implementation(libs.jgit.ssh.apache)

    // Bouncy Castle: required by Apache MINA SSHD (jgit-ssh-apache) for ed25519 key support
    implementation(libs.bouncycastle.provider)
    runtimeOnly(libs.bouncycastle.pkix)

    // YAML parsing (uses kotlinx.serialization)
    implementation(libs.kaml)

    // SLF4J simple binding for console logging
    runtimeOnly(libs.slf4j.simple)


    testImplementation(kotlin("test"))
}

kotlin {
    jvmToolchain(jdkVersion.toInt())
}

tasks.test {
    useJUnitPlatform()
}


openApiGenerate {
    generatorName = "typescript-fetch"
    inputSpec = "$projectDir/src/main/resources/openapi.yaml"
    outputDir = "$projectDir/../webapp/src/api/generated"
    configOptions = mapOf(
        "supportsES6" to "true",
        "typescriptThreePlus" to "true",
        "enumPropertyNaming" to "UPPERCASE",
    )
}

tasks.register<Exec>("dockerBuild") {
    group = "docker"
    description = "Build Docker image"

    val imageName = "ghcr.io/zetkin/lyra-backend:${project.version}"

    commandLine(
        "docker", "build",
        "--build-arg", "JDK_VERSION=$jdkVersion",
        "-t", imageName,
        "."
    )

    doFirst {
        println("\n" + "=".repeat(60))
        println("Building Docker image: $imageName")
        println("Using JDK version: $jdkVersion")
        println("=".repeat(60) + "\n")
    }

    doLast {
        println("\n" + "=".repeat(60))
        println("✓ Docker image built successfully: $imageName")
        println("=".repeat(60) + "\n")
    }
}

