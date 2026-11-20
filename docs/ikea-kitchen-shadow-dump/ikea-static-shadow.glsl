#if defined( USE_STATIC_SHADOWMAP )
    // UNIFORMS
    uniform vec4 shadowDarknessBiasesRadius;
    uniform highp mat4 staticShadowMatrix;
    uniform sampler2D staticShadowMap;

    //CONSTANTS

    const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)
    const vec3 PackFactors      = vec3( 256. * 256. * 256., 256. * 256.,  256. );
    const vec4 UnpackFactors    = UnpackDownscale / vec4( PackFactors, 1. );
    const float pcfSoftShadowRadius = 1.0;


    // FUNCTION DEFINITIONS
    // Common Shadow
    float unpackRGBAToDepth( const in vec4 v );
    bool computeShadowCoords( in float fixedBias, in float normalBias, in vec3 worldNormal, in vec3 worldPosition, in highp mat4 shadowMatrix,
        inout vec4 shadowCoords );

    // Texture2D Specific
    float texture2DCompare( sampler2D depths, vec2 uv, float compare );
    float computeShadowContribBasic( in sampler2D shadowMap, in vec3 shadowCoord );
    float computeShadowContribPCF( in vec2 shadowMapSize, in float radius, in sampler2D shadowMap, in int layer, in vec3 shadowCoord );
    float texture2DShadowLerp( sampler2D depths, vec2 size, vec2 uv, float compare );
    float computeShadowContribPCFSoft( in vec2 shadowMapSize, in sampler2D shadowMap, in vec3 shadowCoord );
    float computeShadowContribVogelDisk( in vec2 shadowMapSize, in float radius, in sampler2D shadowMap, in vec3 shadowCoord );
    float computeShadowContribPCFWitness( in vec2 shadowMapSize, in sampler2D shadowMap, in vec3 shadowCoord );
    float computeStaticShadow( in float fixedBias, in float normalBias, in float radius, in vec3 worldNormal, in vec3 worldPosition,
     in highp mat4 shadowMatrix, in vec3 shadowDirLightDirection, in sampler2D shadowMap );


    // http://maxest.gct-game.net/content/chss.pdf
    vec2 vogelDiskSample( float sampleIndex, float samplesCount, float phi )
    {
        const float GoldenAngle = 2.4;

        float r = sqrt( sampleIndex + 0.5 ) / sqrt( samplesCount );
        float theta = sampleIndex * GoldenAngle + phi;

        float sine = sin( theta );
        float cosine = cos( theta );

        return vec2(r * cosine, r * sine);
    }

    float interleavedGradientNoise( vec2 position_screen )
    {
        const vec3 magic = vec3( 0.06711056, 0.00583715, 52.9829189 );
        return fract ( magic.z * fract ( dot( position_screen, magic.xy ) ) );
    }
    

    float unpackRGBAToDepth( const in vec4 v )
    {
        return dot( v, UnpackFactors );
    }

    bool computeShadowCoords( in float fixedBias, in float normalBias, in vec3 worldNormal, in vec3 worldPosition, in highp mat4 shadowMatrix,
        inout vec4 shadowCoords )
    {
        vec4 normalBiasedWorldPosition = vec4( worldPosition.xyz + ( worldNormal.xyz * normalBias ), 1.0 );
        shadowCoords = shadowMatrix * normalBiasedWorldPosition;

        shadowCoords.xyz = shadowCoords.xyz / shadowCoords.w;
        shadowCoords.z += fixedBias;

        // Allows pixels behind the far plane to still be shadowed correctly
        shadowCoords.z = clamp( shadowCoords.z, 0.0, 0.9999 );

        // don't shadow pixels outside of light frustum
        // use just first frustum (for cascades)
        bvec4 inFrustumVec = bvec4 ( shadowCoords.x >= 0.0, shadowCoords.x <= 1.0, shadowCoords.y >= 0.0, shadowCoords.y <= 1.0 );

        return all( inFrustumVec );
    }

    float texture2DCompare( sampler2D depths, vec2 uv, float compare )
    {
        return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
    }

    #if defined( USE_SHADOWMAP_TYPE_BASIC )

        float computeShadowContribBasic( in sampler2D shadowMap, in vec3 shadowCoord )
        {
            return 1.0 - texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
        }

    #endif

    #if defined( USE_SHADOWMAP_TYPE_PCF )

        float computeShadowContribPCF( in vec2 shadowMapSize, in float radius, in sampler2D shadowMap, in int layer, in vec3 shadowCoord )
        {
            // Percentage-close filtering
            // (9 pixel kernel)
            // http://fabiensanglard.net/shadowmappingPCF/

            vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
            float dx0 = - texelSize.x * radius;
            float dy0 = - texelSize.y * radius;
            float dx1 = + texelSize.x * radius;
            float dy1 = + texelSize.y * radius;

            return 1.0 - (
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
            ) * ( 1.0 / 9.0 );
        }

    #endif

    #if defined( USE_SHADOWMAP_TYPE_PCF_SOFT )

        float texture2DShadowLerp( sampler2D depths, vec2 size, vec2 uv, float compare )
        {
            const vec2 offset = vec2( 0.0, 1.0 );

            vec2 texelSize  = vec2( 1.0 ) / size;
            vec2 centroidUV = floor( uv * size + 0.5 ) / size;

            float lb = texture2DCompare( depths, centroidUV + texelSize * offset.xx, compare );
            float lt = texture2DCompare( depths, centroidUV + texelSize * offset.xy, compare );
            float rb = texture2DCompare( depths, centroidUV + texelSize * offset.yx, compare );
            float rt = texture2DCompare( depths, centroidUV + texelSize * offset.yy, compare );

            vec2 f = fract( uv * size + 0.5 );

            float a = mix( lb, lt, f.y );
            float b = mix( rb, rt, f.y );
            float c = mix( a, b, f.x );

            return c;
        }

        float computeShadowContribPCFSoft( in vec2 shadowMapSize, in sampler2D shadowMap, in vec3 shadowCoord )
        {
            vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
            float dx0 = - texelSize.x * pcfSoftShadowRadius;
            float dy0 = - texelSize.y * pcfSoftShadowRadius;
            float dx1 = + texelSize.x * pcfSoftShadowRadius;
            float dy1 = + texelSize.y * pcfSoftShadowRadius;

            return 1.0 - (
            texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
            texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
            texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
            texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
            texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy, shadowCoord.z )                    +
            texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
            texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
            texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
            texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
            ) * ( 1.0 / 9.0 );
        }

    #endif

    #if defined( USE_SHADOWMAP_TYPE_PCF_VOGEL )

        float computeShadowContribVogelDisk( in vec2 shadowMapSize, in float radius, in sampler2D shadowMap, in vec3 shadowCoord )
        {
            float seed = interleavedGradientNoise( shadowCoord.xy ) * 2.0 * PI;
            float shadowContrib = 0.0;
            for ( float i = 0.0; i < STATIC_SHADOWMAP_SAMPLE_COUNT; i++ )
            {
                shadowContrib += texture2DCompare( shadowMap, vogelDiskSample( i, STATIC_SHADOWMAP_SAMPLE_COUNT, seed )
                    * radius / shadowMapSize + shadowCoord.xy, shadowCoord.z );
            }
            return 1.0 - shadowContrib * ( 1.0 / STATIC_SHADOWMAP_SAMPLE_COUNT );
        }

    #endif

    #if defined( USE_SHADOWMAP_TYPE_PCF_WITNESS )

        float computeShadowContribPCFWitness( in vec2 shadowMapSize, in sampler2D shadowMap, in vec3 shadowCoord )
        {
            vec2 uv = shadowCoord.xy * shadowMapSize; // 1 unit - 1 texel

            vec2 shadowMapSizeInv = 1.0 / shadowMapSize;

            vec2 base_uv;
            base_uv.x = floor(uv.x + 0.5);
            base_uv.y = floor(uv.y + 0.5);

            float s = (uv.x + 0.5 - base_uv.x);
            float t = (uv.y + 0.5 - base_uv.y);

            float uw0 = (4.0 - 3.0 * s);
            float uw1 = 7.0;
            float uw2 = (1.0 + 3.0 * s);

            float u0 = (3.0 - 2.0 * s) / uw0 - 2.0;
            float u1 = (3.0 + s) / uw1;
            float u2 = s / uw2 + 2.0;

            float vw0 = (4.0 - 3.0 * t);
            float vw1 = 7.0;
            float vw2 = (1.0 + 3.0 * t);

            float v0 = (3.0 - 2.0 * t) / vw0 - 2.0;
            float v1 = (3.0 + t) / vw1;
            float v2 = t / vw2 + 2.0;

            base_uv -= vec2(0.5, 0.5);
            base_uv *= shadowMapSizeInv;

            float sum = 0.0;

            sum += uw0 * vw0 * texture2DCompare( shadowMap, base_uv + vec2( u0, v0 ) * shadowMapSizeInv, shadowCoord.z );
            sum += uw1 * vw0 * texture2DCompare( shadowMap, base_uv + vec2( u1, v0 ) * shadowMapSizeInv, shadowCoord.z );
            sum += uw2 * vw0 * texture2DCompare( shadowMap, base_uv + vec2( u2, v0 ) * shadowMapSizeInv, shadowCoord.z );

            sum += uw0 * vw1 * texture2DCompare( shadowMap, base_uv + vec2( u0, v1 ) * shadowMapSizeInv, shadowCoord.z );
            sum += uw1 * vw1 * texture2DCompare( shadowMap, base_uv + vec2( u1, v1 ) * shadowMapSizeInv, shadowCoord.z );
            sum += uw2 * vw1 * texture2DCompare( shadowMap, base_uv + vec2( u2, v1 ) * shadowMapSizeInv, shadowCoord.z );

            sum += uw0 * vw2 * texture2DCompare( shadowMap, base_uv + vec2( u0, v2 ) * shadowMapSizeInv, shadowCoord.z );
            sum += uw1 * vw2 * texture2DCompare( shadowMap, base_uv + vec2( u1, v2 ) * shadowMapSizeInv, shadowCoord.z );
            sum += uw2 * vw2 * texture2DCompare( shadowMap, base_uv + vec2( u2, v2 ) * shadowMapSizeInv, shadowCoord.z );

            sum *= 1.0 / 144.0;

            return 1.0 - sum;
        }

    #endif

    float computeStaticShadow( in float fixedBias, in float normalBias, in float radius, in vec3 worldNormal, in vec3 worldPosition,
        in highp mat4 shadowMatrix, in vec3 shadowDirLightDirection, in sampler2D shadowMap )
    {
        vec4 shadowCoords ;
        if( !computeShadowCoords( fixedBias, normalBias, worldNormal, worldPosition, shadowMatrix, shadowCoords ) )
        {
            return 0.0;
        }

        // Dot product between world normal and world shadow light direction
        float shadowDotProduct = dot( worldNormal, shadowDirLightDirection );

        float shadowContrib = 0.0;

        // Face to shadow light
        if( shadowDotProduct > 0.001  )
        {
            #if ( STATIC_SHADOWMAP_TYPE == SHADOWMAP_TYPE_PCF )
                shadowContrib = computeShadowContribPCF( vec2( STATIC_SHADOWMAP_SIZE ), radius, shadowMap, 0, shadowCoords.xyz );
            #elif ( STATIC_SHADOWMAP_TYPE == SHADOWMAP_TYPE_PCF_SOFT )
                shadowContrib = computeShadowContribPCFSoft( vec2( STATIC_SHADOWMAP_SIZE ), shadowMap, shadowCoords.xyz );
            #elif ( STATIC_SHADOWMAP_TYPE == SHADOWMAP_TYPE_PCF_VOGEL )
                shadowContrib = computeShadowContribVogelDisk( vec2( STATIC_SHADOWMAP_SIZE ), radius, shadowMap, shadowCoords.xyz );
            #elif ( STATIC_SHADOWMAP_TYPE == SHADOWMAP_TYPE_PCF_WITNESS )
                shadowContrib = computeShadowContribPCFWitness( vec2( STATIC_SHADOWMAP_SIZE ), shadowMap, shadowCoords.xyz );
            #else
                shadowContrib = computeShadowContribBasic( shadowMap, shadowCoords.xyz );
            #endif
        }

        return shadowContrib;
    }

#endif