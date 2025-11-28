import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Input, Button } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { AuthContext } from '../../context/AuthContext';

const Icon = ({ name, size, color, onPress }) => (
    <TouchableOpacity 
        onPress={onPress} 
        style={{ 
            padding: 8,
            justifyContent: 'center', 
            alignItems: 'center',
            minWidth: 40,
            minHeight: 40,
            borderRadius: 6,
        }}
        activeOpacity={0.6}
    >
        <Text style={{ 
            fontSize: size, 
            color: color, 
            lineHeight: size,
            textAlign: 'center'
        }}>
            {name === 'eye-off' ? '🚫' : '👁️'}
        </Text>
    </TouchableOpacity>
);

const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumberOrSymbol = /[\d!@#$%^&*()]/.test(password);

    return {
        minLength: password.length >= minLength,
        hasUpperCase: hasUpperCase,
        hasLowerCase: hasLowerCase,
        hasNumberOrSymbol: hasNumberOrSymbol,
        isStrong: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumberOrSymbol,
    };
};

const RequirementItem = ({ fulfilled, requirementText, t }) => (
    <View style={styles.requirementRow}>
        <View style={[
            styles.requirementDot,
            { backgroundColor: fulfilled ? t.colors.primary : t.colors.border }
        ]} />
        <Text style={[
            styles.requirementText,
            { 
                color: fulfilled ? t.colors.primary : t.colors.textSecondary,
                fontWeight: fulfilled ? '600' : '400'
            }
        ]}>
            {requirementText}
        </Text>
    </View>
);

const PasswordStrength = ({ strength, t }) => {
    const getStrengthColor = () => {
        if (strength === 'strong') return t.colors.success;
        if (strength === 'medium') return t.colors.warning;
        return t.colors.error;
    };

    const getStrengthText = () => {
        if (strength === 'strong') return 'Strong password';
        if (strength === 'medium') return 'Medium strength';
        return 'Weak password';
    };

    return (
        <View style={styles.strengthContainer}>
            <View style={styles.strengthBar}>
                <View style={[
                    styles.strengthFill,
                    { 
                        width: strength === 'strong' ? '100%' : strength === 'medium' ? '66%' : '33%',
                        backgroundColor: getStrengthColor()
                    }
                ]} />
            </View>
            <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
                {getStrengthText()}
            </Text>
        </View>
    );
};

export default function RegisterScreen({ navigation }) {
    const t = useTheme();
    const { register } = useContext(AuthContext);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const validation = validatePassword(password);
    const passwordStrength = validation.isStrong ? 'strong' : 
                           (validation.minLength && (validation.hasUpperCase || validation.hasLowerCase)) ? 'medium' : 'weak';

    const submit = async () => {
        setMsg('');
        setIsLoading(true);

        if (!validation.isStrong) {
            setMsg('Please meet all password requirements to continue.');
            setIsLoading(false);
            return;
        }

        try {
            await register(username.trim(), email.trim(), password);
        } catch (e) {
            const m = e?.response?.data?.message || (e?.response?.data?.errors ? JSON.stringify(e.response.data.errors) : 'Registration failed');
            setMsg(m);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: t.colors.background }]}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                {/* Header Section - Compact */}
                <View style={styles.headerSection}>
                    <Text style={[styles.welcomeText, { color: t.colors.text }]}>
                        Create account
                    </Text>
                    <Text style={[styles.subtitle, { color: t.colors.textSecondary }]}>
                        Join us today
                    </Text>
                </View>

                {/* Form Section - Compact */}
                <View style={styles.formSection}>
                    {/* Username Input */}
                    <View style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, { color: t.colors.text }]}>
                            Username
                        </Text>
                        <Input
                            placeholder="Choose a username"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            style={[styles.input, { borderColor: t.colors.border }]}
                        />
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, { color: t.colors.text }]}>
                            Email
                        </Text>
                        <Input
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={[styles.input, { borderColor: t.colors.border }]}
                        />
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, { color: t.colors.text }]}>
                            Password
                        </Text>
                        <Input
                            placeholder="Create a strong password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            rightIcon={
                                <Icon
                                    name={showPassword ? 'eye' : 'eye-off'}
                                    size={18}
                                    color={t.colors.textSecondary}
                                    onPress={() => setShowPassword(!showPassword)}
                                />
                            }
                            style={[styles.input, { borderColor: t.colors.border }]}
                        />
                        
                        {/* Password Strength Indicator */}
                        {password.length > 0 && (
                            <PasswordStrength strength={passwordStrength} t={t} />
                        )}
                    </View>

                    {/* Password Requirements - Compact */}
                    {password.length > 0 && (
                        <View style={styles.requirementsContainer}>
                            <Text style={[styles.requirementsTitle, { color: t.colors.text }]}>
                                Password must contain:
                            </Text>
                            <View style={styles.requirementsGrid}>
                                <RequirementItem 
                                    fulfilled={validation.minLength} 
                                    requirementText="8+ characters" 
                                    t={t}
                                />
                                <RequirementItem 
                                    fulfilled={validation.hasUpperCase} 
                                    requirementText="Uppercase letter" 
                                    t={t}
                                />
                                <RequirementItem 
                                    fulfilled={validation.hasLowerCase} 
                                    requirementText="Lowercase letter" 
                                    t={t}
                                />
                                <RequirementItem 
                                    fulfilled={validation.hasNumberOrSymbol} 
                                    requirementText="Number or symbol" 
                                    t={t}
                                />
                            </View>
                        </View>
                    )}

                    {/* Error Message */}
                    {msg ? (
                        <Text style={[styles.errorText, { color: t.colors.error }]}>{msg}</Text>
                    ) : null}

                    {/* Register Button */}
                    <Button
                        title={isLoading ? "Creating account..." : "Create account"}
                        onPress={submit}
                        color={t.colors.primary}
                        style={styles.registerButton}
                        disabled={!validation.isStrong || isLoading}
                    />

                    {/* Sign In Link */}
                    <View style={styles.signInContainer}>
                        <Text style={[styles.signInText, { color: t.colors.textSecondary }]}>
                            Already have an account?{' '}
                        </Text>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={[styles.signInLink, { color: t.colors.primary }]}>
                                Sign in
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Background Accent Elements - Smaller */}
                <View style={[styles.backgroundAccent, { backgroundColor: t.colors.primary }]} />
                <View style={[styles.backgroundAccent2, { backgroundColor: t.colors.primary }]} />
                
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardAvoid: {
        flex: 1,
        justifyContent: 'center',
    },
    headerSection: {
        paddingHorizontal: 24,
        paddingBottom: 30,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 6,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '400',
        textAlign: 'center',
    },
    formSection: {
        paddingHorizontal: 24,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1.5,
    },
    requirementsContainer: {
        marginTop: 6,
        marginBottom: 12,
    },
    requirementsTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    requirementsGrid: {
        gap: 6,
    },
    requirementRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    requirementDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        marginRight: 8,
    },
    requirementText: {
        fontSize: 12,
    },
    strengthContainer: {
        marginTop: 6,
    },
    strengthBar: {
        height: 3,
        backgroundColor: '#e5e7eb',
        borderRadius: 1.5,
        overflow: 'hidden',
        marginBottom: 4,
    },
    strengthFill: {
        height: '100%',
        borderRadius: 1.5,
    },
    strengthText: {
        fontSize: 11,
        fontWeight: '600',
    },
    errorText: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 12,
        fontWeight: '500',
    },
    registerButton: {
        marginTop: 6,
        marginBottom: 16,
    },
    signInContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signInText: {
        fontSize: 14,
    },
    signInLink: {
        fontSize: 14,
        fontWeight: '600',
    },
    backgroundAccent: {
        position: 'absolute',
        top: -30,
        right: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
        opacity: 0.05,
        zIndex: -1,
    },
    backgroundAccent2: {
        position: 'absolute',
        bottom: -40,
        left: -40,
        width: 150,
        height: 150,
        borderRadius: 75,
        opacity: 0.03,
        zIndex: -1,
    },
});