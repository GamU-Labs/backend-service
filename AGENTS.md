Backend (Effect code in core, persistence, api)

NEVER use any or type casts - use Schema.make(), decodeUnknown, identity
NEVER use global Error - use Schema.TaggedError for all domain errors
NEVER use catchAllCause - it catches defects (bugs); use catchAll or mapError
NEVER use disableValidation: true - banned by lint rule
NEVER use \*FromSelf schemas - use standard variants (Schema.Option, not OptionFromSelf)
NEVER use Sync variants - use Schema.decodeUnknown not decodeUnknownSync
NEVER create index.ts barrel files - import from specific modules
