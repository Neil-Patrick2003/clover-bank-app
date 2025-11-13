import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Input, Button, Card } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { AuthContext } from '../../context/AuthContext';

// --- CUSTOM ICON COMPONENT (The Toggle) ---
const Icon = ({ name, size, color, onPress }) => (
    <TouchableOpacity onPress={onPress} style={{ padding: 5 }}>
        {/* Using Emojis as placeholders for eye icons */}
        <Text style={{ fontSize: size, color: color }}>
            {name === 'eye-off' ? '🙈' : '👁️'}
        </Text>
    </TouchableOpacity>
);

// --- PASSWORD VALIDATION LOGIC ---
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

// --- PASSWORD REQUIREMENT ITEM COMPONENT (Modified for simple list) ---
const RequirementItem = ({ fulfilled, requirementText, t }) => (
    <View style={styles.simpleRequirementRow}>
        <Text style={{ 
            color: fulfilled ? t.colors.primary : t.colors.textSecondary,
            marginRight: 8,
            fontSize: 12, // Small text size
        }}>
            {fulfilled ? '✅' : '•'}
        </Text>
        <Text style={{ 
            color: fulfilled ? t.colors.primary : t.colors.textSecondary,
            fontSize: 12, // Small text size
        }}>
            {requirementText}
        </Text>
    </View>
);


export default function RegisterScreen({ navigation }) {
    const t = useTheme();
    const { register } = useContext(AuthContext);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const validation = validatePassword(password);

    const submit = async () => {
        setMsg('');

        if (!validation.isStrong) {
            setMsg('Password does not meet all security requirements.');
            return;
        }

        try {
            await register(username.trim(), email.trim(), password);
        } catch (e) {
            const m = e?.response?.data?.message || (e?.response?.data?.errors ? JSON.stringify(e.response.data.errors) : 'Register failed');
            setMsg(m);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: t.colors.bg }]}>

            {/* Aesthetic Background Element (Green Touch) */}
            <View style={[
                styles.backgroundShape,
                { backgroundColor: t.colors.primary, opacity: 0.15 }
            ]} />

            {/* Centered Form Card */}
            <View style={styles.contentWrapper}>
                <Card style={[styles.card, { gap: 15 }]}>

                    {/* Header */}
                    <Text style={styles.subHeader}>GET STARTED</Text>
                    <Text style={[styles.header, { color: t.colors.text }]}>
                        Create Your Account
                    </Text>

                    {/* Username and Email */}
                    <Input
                        placeholder="Username"
                        value={username}
                        onChangeText={setUsername}
                    />
                    <Input
                        placeholder="Email Address"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    {/* PASSWORD INPUT WITH SHOW/HIDE LOGIC */}
                    <Input
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        rightIcon={
                            <Icon
                                name={showPassword ? 'eye' : 'eye-off'}
                                size={20}
                                color={t.colors.textSecondary}
                                onPress={() => setShowPassword(!showPassword)}
                            />
                        }
                    />
                    
                    {/* --- PASSWORD STRENGTH FEEDBACK (Simple List) --- */}
                    {password.length > 0 && (
                        <View style={styles.validationBox}>
                            <Text style={[styles.validationTitle, { color: t.colors.text }]}>Password Requirements:</Text>
                            {/* Simple List Items */}
                            <RequirementItem 
                                fulfilled={validation.minLength} 
                                requirementText="Minimum 8 characters" 
                                t={t}
                            />
                            <RequirementItem 
                                fulfilled={validation.hasUpperCase} 
                                requirementText="One uppercase letter" 
                                t={t}
                            />
                            <RequirementItem 
                                fulfilled={validation.hasLowerCase} 
                                requirementText="One lowercase letter" 
                                t={t}
                            />
                            <RequirementItem 
                                fulfilled={validation.hasNumberOrSymbol} 
                                requirementText="One number or symbol" 
                                t={t}
                            />
                        </View>
                    )}


                    {/* Error Message */}
                    {msg ? (
                        <Text style={styles.errorText}>{msg}</Text>
                    ) : null}

                    {/* Buttons */}
                    <Button
                        title="Register"
                        onPress={submit}
                        color={t.colors.primary}
                        style={{ marginTop: 10 }}
                        disabled={!validation.isStrong} 
                    />
                    <Button
                        title="Back to Login"
                        variant="ghost"
                        onPress={() => navigation.goBack()}
                        color={t.colors.primary}
                    />
                </Card>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    contentWrapper: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        padding: 30,
        borderRadius: 12,
        elevation: 8,
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    subHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6aa84f',
        marginBottom: 5,
        textAlign: 'center',
        letterSpacing: 1.5,
    },
    header: {
        fontSize: 26,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 20,
    },
    errorText: {
        color: '#b91c1c',
        textAlign: 'center',
        fontSize: 14,
        marginTop: 5,
    },
    // --- PASSWORD VALIDATION STYLES ---
    validationBox: {
        backgroundColor: '#f9f9f9', 
        borderRadius: 8,
        padding: 12,
        marginVertical: 5,
        borderWidth: 1,
        borderColor: '#eee',
    },
    validationTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    simpleRequirementRow: { // NEW STYLE FOR SIMPLE LIST
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 2, // Tight spacing for a small list
    },
    // --- BACKGROUND STYLES ---
    backgroundShape: {
        position: 'absolute',
        top: -100,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
    },
});