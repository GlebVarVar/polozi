# Build context = apps/api
FROM rust:1-alpine AS builder

# build-base: C toolchain needed by `ring` (jsonwebtoken) on musl
RUN apk add --no-cache build-base musl-dev

WORKDIR /app

# Cache dependency compilation with a dummy main
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release && rm -rf src

# Real build — migrations must be present (sqlx::migrate! reads ./migrations at compile time)
COPY migrations ./migrations
COPY src ./src
RUN touch src/main.rs && cargo build --locked --release

FROM alpine:3.21
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/target/release/polozi-api /usr/local/bin/

ENV PORT=3001
EXPOSE 3001
CMD ["polozi-api"]
