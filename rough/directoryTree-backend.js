/*
node_modules
rough
 ┣ directoryTree-backend.js
 ┣ HowIDoIt-backend.txt
 scripts
 ┣ seed.js

src
 ┣ app
 ┃ ┣ app.js
 ┃ ┗ server.js
 ┣ features
 ┃ ┣ admin
 ┃ ┃ ┣ admin.controller.js
 ┃ ┃ ┣ admin.routes.js
 ┃ ┃ ┣ admin.service.js
 ┃ ┃ ┗ admin.validation.js
 ┃ ┣ assignment
 ┃ ┃ ┗ assignment.service.js
 ┃ ┣ auth
 ┃ ┃ ┣ auth.controller.js
 ┃ ┃ ┣ auth.routes.js
 ┃ ┃ ┣ auth.service.js
 ┃ ┃ ┗ auth.validation.js
 ┃ ┣ availability
 ┃ ┃ ┣ availability.controller.js
 ┃ ┃ ┣ availability.model.js
 ┃ ┃ ┣ availability.routes.js
 ┃ ┃ ┣ availability.service.js
 ┃ ┃ ┗ availability.validation.js
 ┃ ┣ bookings
 ┃ ┃ ┣ booking.config.js
 ┃ ┃ ┣ booking.constants.js
 ┃ ┃ ┣ booking.controller.js
 ┃ ┃ ┣ booking.model.js
 ┃ ┃ ┣ booking.routes.js
 ┃ ┃ ┣ booking.service.js
 ┃ ┃ ┗ booking.validation.js
 ┃ ┣ fitnessProfiles
 ┃ ┃ ┣ fitnessProfile.constants.js
 ┃ ┃ ┣ fitnessProfile.controller.js
 ┃ ┃ ┣ fitnessProfile.model.js
 ┃ ┃ ┣ fitnessProfile.routes.js
 ┃ ┃ ┣ fitnessProfile.service.js
 ┃ ┃ ┗ fitnessProfile.validation.js
 ┃ ┣ notifications
 ┃ ┃ ┣ notification.constants.js
 ┃ ┃ ┣ notification.controller.js
 ┃ ┃ ┣ notification.model.js
 ┃ ┃ ┣ notification.routes.js
 ┃ ┃ ┣ notification.service.js
 ┃ ┃ ┗ notification.validation.js
 ┃ ┣ packages
 ┃ ┃ ┣ package.config.js
 ┃ ┃ ┣ package.controller.js
 ┃ ┃ ┣ package.model.js
 ┃ ┃ ┣ package.routes.js
 ┃ ┃ ┣ package.service.js
 ┃ ┃ ┗ package.validation.js
 ┃ ┣ payments
 ┃ ┃ ┣ payment.constants.js
 ┃ ┃ ┣ payment.model.js
 ┃ ┃ ┗ payment.service.js
 ┃ ┣ pricing
 ┃ ┃ ┣ pricing.config.js
 ┃ ┃ ┣ pricing.controller.js
 ┃ ┃ ┣ pricing.routes.js
 ┃ ┃ ┣ pricing.service.js
 ┃ ┃ ┗ pricing.validation.js
 ┃ ┣ recommendations
 ┃ ┃ ┣ recommendation.catalog.js
 ┃ ┃ ┣ recommendation.config.js
 ┃ ┃ ┣ recommendation.controller.js
 ┃ ┃ ┣ recommendation.routes.js
 ┃ ┃ ┣ recommendation.rules.js
 ┃ ┃ ┗ recommendation.service.js
 ┃ ┣ sessionRecords
 ┃ ┃ ┣ sessionRecord.controller.js
 ┃ ┃ ┣ sessionRecord.model.js
 ┃ ┃ ┣ sessionRecord.routes.js
 ┃ ┃ ┣ sessionRecord.service.js
 ┃ ┃ ┗ sessionRecord.validation.js
 ┃ ┣ sessions
 ┃ ┃ ┣ session.config.js
 ┃ ┃ ┣ session.controller.js
 ┃ ┃ ┣ session.routes.js
 ┃ ┃ ┣ session.service.js
 ┃ ┃ ┣ session.state.js
 ┃ ┃ ┗ session.worker.js
 ┃ ┣ slots
 ┃ ┃ ┣ slot.controller.js
 ┃ ┃ ┣ slot.routes.js
 ┃ ┃ ┣ slot.service.js
 ┃ ┃ ┗ slot.validation.js
 ┃ ┣ time
 ┃ ┃ ┣ time.controller.js
 ┃ ┃ ┗ time.routes.js
 ┃ ┣ trainers
 ┃ ┃ ┣ trainer.model.js
 ┃ ┃ ┗ trainer.service.js
 ┃ ┣ users
 ┃ ┃ ┣ user.constants.js
 ┃ ┃ ┣ user.model.js
 ┃ ┃ ┗ user.service.js
 ┃ ┣ zones
 ┃ ┃ ┣ zone.controller.js
 ┃ ┃ ┣ zone.model.js
 ┃ ┃ ┣ zone.routes.js
 ┃ ┃ ┗ zone.service.js
 ┃ ┗ .gitkeep
 ┗ shared
 ┃ ┣ config
 ┃ ┃ ┣ db.js
 ┃ ┃ ┗ env.js
 ┃ ┣ middlewares
 ┃ ┃ ┣ error.middleware.js
 ┃ ┃ ┣ idempotency.middleware.js
 ┃ ┃ ┣ jwt.middleware.js
 ┃ ┃ ┣ role.middleware.js
 ┃ ┃ ┗ validate.middleware.js
 ┃ ┣ models
 ┃ ┃ ┗ location.schema.js
 ┃ ┗ utils
 ┃ ┃ ┣ AppError.js
 ┃ ┃ ┣ geo.js
 ┃ ┃ ┣ lock.js
 ┃ ┃ ┣ retry.js
 ┃ ┃ ┣ time.js
 ┃ ┃ ┗ token.js

.env
.env.sample
.gitignore
package-lock.json
package.json
*/