const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "M-Assist",
            version: "1.0.0",
            description: "Documentation for M-Assist Application",
        },
        servers: [
            {
                url: "http://localhost:3000",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ["./routes/*.js"], // or wherever your route files are
};

module.exports = swaggerOptions;